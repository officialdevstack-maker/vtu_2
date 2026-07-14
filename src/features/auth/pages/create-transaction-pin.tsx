import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { CheckCircle2, Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card } from "@/features/user/components/shared-ui";
import { AuthLayout, authCardCls } from "../components/AuthLayout";
import { accountService } from "@/features/account/services/accountService";
import { authService } from "../authService";
import { PinDots, PinKeypad } from "../components/PinKeypad";
import { getAuthToken, setAuthToken } from "@/shared/api/apiClient";
import { useAuth } from "@/shared/providers/auth";

const PIN_LENGTH = 4;

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    const validationErrors = data?.errors;
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      return Object.values(validationErrors).flat().join(" ");
    }
    if (typeof data?.message === "string") return data.message;
  }
  return "Could not save your PIN. Please try again.";
}

type Stage = "create" | "confirm";

export default function CreateTransactionPinPage() {
  const [stage, setStage] = useState<Stage>("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isInitializing, refreshUser } = useAuth();

  const value = stage === "create" ? pin : confirmPin;
  const setValue = stage === "create" ? setPin : setConfirmPin;

  const submit = async (finalPin: string, finalConfirm: string) => {
    if (!getAuthToken()) {
      setError("Please sign in again before creating your transaction PIN.");
      window.setTimeout(() => navigate("/login", { replace: true }), 1200);
      return;
    }

    setSubmitting(true);
    try {
      await accountService.updatePin({ pin: finalPin, pin_confirmation: finalConfirm });
      await refreshUser();
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setAuthToken(null);
        setError("Your session has expired. Please sign in again.");
        window.setTimeout(() => navigate("/login", { replace: true }), 1200);
        return;
      }
      setError(extractErrorMessage(err));
      setStage("create");
      setPin("");
      setConfirmPin("");
    } finally {
      setSubmitting(false);
    }
  };

  const submitRef = useRef(submit);
  submitRef.current = submit;

  const handleDigit = (digit: string) => {
    if (submitting || success || value.length >= PIN_LENGTH) return;
    setError(null);
    const next = value + digit;
    setValue(next);

    if (next.length !== PIN_LENGTH) return;

    if (stage === "create") {
      window.setTimeout(() => setStage("confirm"), 200);
      return;
    }

    if (next === pin) {
      void submitRef.current(pin, next);
    } else {
      setError("PINs do not match. Try again.");
      setShake(true);
      window.setTimeout(() => {
        setShake(false);
        setStage("create");
        setPin("");
        setConfirmPin("");
      }, 500);
    }
  };

  const handleBackspace = () => {
    if (submitting || success) return;
    setValue(value.slice(0, -1));
  };

  const handleClear = () => {
    if (submitting || success) return;
    setValue("");
  };

  const handleResendVerification = async () => {
    if (resendingEmail || resendCooldown > 0) return;
    setResendingEmail(true);
    try {
      const response = await authService.resendVerificationEmail();
      setEmailNotice(response.message || "Verification email sent.");
      setResendCooldown(60);
    } catch {
      setEmailNotice(null);
      setResendCooldown(30);
    } finally {
      setResendingEmail(false);
    }
  };

  useEffect(() => {
    const state = location.state as { emailNotice?: string } | null;
    const notice = state?.emailNotice;
    if (notice) setEmailNotice(notice);
    if (notice) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timeout = window.setTimeout(() => setResendCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [resendCooldown]);

  // Keyboard support alongside the on-screen keypad.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) handleDigit(e.key);
      else if (e.key === "Backspace") handleBackspace();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => navigate("/dashboard", { replace: true }), 900);
    return () => window.clearTimeout(timeout);
  }, [navigate, success]);

  useEffect(() => {
    if (isInitializing || isAuthenticated || getAuthToken()) return;
    const timeout = window.setTimeout(() => navigate("/login", { replace: true }), 1200);
    setError("Please sign in again before creating your transaction PIN.");
    return () => window.clearTimeout(timeout);
  }, [isAuthenticated, isInitializing, navigate]);

  // Already has a PIN (e.g. revisited this URL directly) — nothing to do
  // here, send them on to where they were actually headed.
  useEffect(() => {
    if (isInitializing || !isAuthenticated || success) return;
    if (user?.user_type !== "admin" && user?.has_pin) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isInitializing, navigate, success, user]);

  return (
    <AuthLayout>
      <Card className={authCardCls}>
        {success ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">PIN created</h1>
            <p className="mt-2 text-sm text-slate-500">Your transaction PIN is ready. Taking you to your dashboard.</p>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
              {stage === "create" ? "Create transaction PIN" : "Confirm transaction PIN"}
            </h1>
            <p className="mb-6 mt-1 text-sm text-slate-500 sm:mb-8">
              {stage === "create"
                ? "Choose 4 digits you'll use to authorize wallet actions."
                : "Enter the same 4 digits again to confirm."}
            </p>

            {error && (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {emailNotice && (
              <div
                className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-left text-sm text-emerald-700"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p>{emailNotice}</p>
                    {user?.email && <p className="mt-1 break-words text-xs opacity-80">{user.email}</p>}
                    {!user?.email_verified_at && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={() => void handleResendVerification()}
                        loading={resendingEmail}
                        disabled={resendingEmail || resendCooldown > 0}
                      >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend email"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className={`mb-8 sm:mb-10 ${shake ? "animate-shake" : ""}`}>
              <PinDots length={PIN_LENGTH} filled={value.length} />
            </div>

            <PinKeypad
              onDigit={handleDigit}
              onBackspace={handleBackspace}
              onClear={handleClear}
              disabled={submitting}
            />
          </div>
        )}
      </Card>
    </AuthLayout>
  );
}
