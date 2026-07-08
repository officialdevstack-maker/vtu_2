import { useState } from "react";
import axios from "axios";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/shared/providers/auth";
import { accountService } from "@/features/account/services/accountService";
import { inputCls } from "../../user/components/shared-ui";

// The /setup bootstrap route on the backend creates a default owner account
// (admin / admin123 / admin@default.com) so a fresh install has someone who
// can reach the admin panel at all. That account must not keep its published
// credentials, so this modal blocks the whole admin UI — no dismiss — until
// the identity is rotated. Detection is the bootstrap email itself: once the
// profile update lands, refreshUser() drops the flag and the modal unmounts.
const DEFAULT_OWNER_EMAIL = "admin@default.com";
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";

type FormState = {
  fullname: string;
  username: string;
  email: string;
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const validate = (form: FormState): FieldErrors => {
  const errors: FieldErrors = {};
  if (!form.fullname.trim()) errors.fullname = "Enter your name.";
  if (!form.username.trim()) {
    errors.username = "Choose a username.";
  } else if (form.username.trim().toLowerCase() === DEFAULT_USERNAME) {
    errors.username = "Pick something other than the default “admin”.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  } else if (form.email.trim().toLowerCase() === DEFAULT_OWNER_EMAIL) {
    errors.email = "Use your real email, not the placeholder.";
  }
  if (!form.currentPassword) errors.currentPassword = "Enter the current password.";
  if (form.password.length < 8) {
    errors.password = "Use at least 8 characters.";
  } else if (form.password === DEFAULT_PASSWORD) {
    errors.password = "Pick something other than the default password.";
  }
  if (form.passwordConfirmation !== form.password) {
    errors.passwordConfirmation = "Passwords do not match.";
  }
  return errors;
};

const extractErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    const validationErrors = data?.errors;
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      return Object.values(validationErrors).flat().join(" ");
    }
    if (typeof data?.message === "string" && data.message !== "Validation Error") {
      return data.message;
    }
    if (err.message) return err.message;
  }
  return "Something went wrong. Please try again.";
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const DefaultCredentialsModal = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState<FormState>({
    fullname: "",
    username: "",
    email: "",
    currentPassword: "",
    password: "",
    passwordConfirmation: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (user?.email?.toLowerCase() !== DEFAULT_OWNER_EMAIL) {
    return null;
  }

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validate(form);
    setErrors(fieldErrors);
    setServerError("");
    if (Object.keys(fieldErrors).length > 0) return;

    setIsSaving(true);
    try {
      // Password first: a wrong current password aborts here, before the
      // profile (and the modal's email-based trigger) has been touched.
      await accountService.updatePassword({
        current_password: form.currentPassword,
        password: form.password,
        password_confirmation: form.passwordConfirmation,
      });
      await accountService.updateProfile({
        fullname: form.fullname.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
      });
      await refreshUser();
    } catch (err) {
      setServerError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="my-auto w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-amber-100 p-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-semibold text-slate-900">Secure your account</p>
            <p className="mt-1 text-sm text-slate-600">
              You are signed in with the default setup credentials. Set your own
              details before using the admin panel.
            </p>
          </div>
        </div>

        {serverError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
            {serverError}
          </div>
        )}

        <div className="mt-5 space-y-4">
          <Field label="Full name" error={errors.fullname}>
            <input className={inputCls} value={form.fullname} onChange={set("fullname")} placeholder="Your name" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username" error={errors.username}>
              <input className={inputCls} value={form.username} onChange={set("username")} placeholder="New username" autoComplete="username" />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className={inputCls} type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
            </Field>
          </div>
          <Field label="Current password" error={errors.currentPassword}>
            <input className={inputCls} type="password" value={form.currentPassword} onChange={set("currentPassword")} autoComplete="current-password" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New password" error={errors.password}>
              <input className={inputCls} type="password" value={form.password} onChange={set("password")} autoComplete="new-password" />
            </Field>
            <Field label="Confirm password" error={errors.passwordConfirmation}>
              <input className={inputCls} type="password" value={form.passwordConfirmation} onChange={set("passwordConfirmation")} autoComplete="new-password" />
            </Field>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : "Save and continue"}
        </button>
      </form>
    </div>
  );
};

export default DefaultCredentialsModal;
