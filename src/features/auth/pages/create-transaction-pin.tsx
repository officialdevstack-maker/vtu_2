import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/features/user/components/shared-ui";
import { AuthLayout, authCardCls } from "../components/AuthLayout";
import { accountService } from "@/features/account/services/accountService";
import { PinDots, PinKeypad } from "../components/PinKeypad";

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
  const navigate = useNavigate();

  const value = stage === "create" ? pin : confirmPin;
  const setValue = stage === "create" ? setPin : setConfirmPin;

  const submit = async (finalPin: string, finalConfirm: string) => {
    setSubmitting(true);
    try {
      await accountService.updatePin({ pin: finalPin, pin_confirmation: finalConfirm });
      setSuccess(true);
    } catch (err) {
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
            <h1 className="text-2xl font-semibold text-slate-950 tracking-tight">
              {stage === "create" ? "Create transaction PIN" : "Confirm transaction PIN"}
            </h1>
            <p className="mt-1 mb-8 text-sm text-slate-500">
              {stage === "create"
                ? "Choose 4 digits you'll use to authorize wallet actions."
                : "Enter the same 4 digits again to confirm."}
            </p>

            {error && (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className={`mb-10 ${shake ? "animate-shake" : ""}`}>
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
