import type { ReactNode } from "react";
import axios from "axios";
import { AlertCircle } from "lucide-react";
import { CopyButton } from "../../../user/components/shared-ui";

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
      {children}
    </h3>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="block text-xs font-medium text-slate-600">
          {label}
        </label>
        {hint && !error && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

// Every backend failure here is either a validation-shaped 4xx or the
// generic `fail()` 500 wrapper — both put a human-readable string at
// response.data.message once unwrapped through the (single) envelope.
export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    const validationErrors = data?.errors;
    if (
      validationErrors &&
      !Array.isArray(validationErrors) &&
      Object.keys(validationErrors).length > 0
    ) {
      return Object.values(validationErrors).flat().join(" ");
    }
    if (typeof data?.message === "string") {
      return data.message;
    }
    if (err.message) return err.message;
  }
  return "Something went wrong. Please try again.";
}

export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <CopyButton value={value} label={label} />
      </div>
      <p className="mt-0.5 text-sm text-slate-700 break-all">{value}</p>
    </div>
  );
}
