import { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { z } from "zod";
import {
  PageHeader,
  Card,
  Button,
  CopyButton,
  SkeletonLine,
  inputCls,
} from "../../user/components/shared-ui";
import {
  generalService,
  type GeneralSettings,
  type GeneralSettingsPayload,
} from "./generalService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
      {children}
    </h3>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
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

function ErrorBanner({ message }: { message: string }) {
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
function extractErrorMessage(err: unknown): string {
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
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

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  app_name: string;
  app_email: string;
  app_phone: string;
  app_address: string;
  logo: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bvn: string;
};

const blankForm = (): FormState => ({
  app_name: "",
  app_email: "",
  app_phone: "",
  app_address: "",
  logo: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  bvn: "",
});

const toForm = (g: GeneralSettings): FormState => ({
  app_name: g.app_name ?? "",
  app_email: g.app_email ?? "",
  app_phone: g.app_phone ?? "",
  app_address: g.app_address ?? "",
  logo: g.logo ?? "",
  bankName: g.bankName ?? "",
  accountName: g.accountName ?? "",
  accountNumber: g.accountNumber ?? "",
  bvn: g.bvn ?? "",
});

const toPayload = (form: FormState): GeneralSettingsPayload => ({
  app_name: form.app_name.trim(),
  app_email: form.app_email.trim(),
  app_phone: form.app_phone.trim() || null,
  app_address: form.app_address.trim() || null,
  logo: form.logo.trim() || null,
  bankName: form.bankName.trim() || null,
  accountName: form.accountName.trim() || null,
  accountNumber: form.accountNumber.trim() || null,
  bvn: form.bvn.trim() || null,
});

// ─── Validation ───────────────────────────────────────────────────────────────

const digitsOnly = (v: string) => v === "" || /^\d+$/.test(v);

const settingsFormSchema = z.object({
  app_name: z.string().trim().min(1, { message: "Platform name is required." }),
  app_email: z
    .string()
    .trim()
    .min(1, { message: "Contact email is required." })
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Enter a valid email address.",
    }),
  app_phone: z.string(),
  app_address: z.string(),
  logo: z
    .string()
    .refine((v) => v === "" || /^https?:\/\//.test(v), {
      message: "Enter a full URL (starting with http:// or https://).",
    }),
  bankName: z.string(),
  accountName: z.string(),
  accountNumber: z
    .string()
    .refine((v) => digitsOnly(v) && (v === "" || v.length === 10), {
      message: "Account number must be exactly 10 digits.",
    }),
  bvn: z
    .string()
    .refine((v) => digitsOnly(v) && (v === "" || v.length === 11), {
      message: "BVN must be exactly 11 digits.",
    }),
});

type FormErrors = Partial<Record<keyof FormState, string>>;

function validateForm(form: FormState): FormErrors {
  const result = settingsFormSchema.safeParse(form);
  if (result.success) return {};

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof FormErrors | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [general, setGeneral] = useState<GeneralSettings | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    generalService
      .get()
      .then((g) => {
        setGeneral(g);
        setForm(toForm(g));
      })
      .catch((err) => setLoadError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    setSaveError(null);
    try {
      const updated = await generalService.update(toPayload(form));
      setGeneral(updated);
      setForm(toForm(updated));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Settings"
          description="Configure platform-wide information and payout details"
        />
        <Card className="p-5 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-10 w-full" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  if (loadError || !general) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Settings"
          description="Configure platform-wide information and payout details"
        />
        <Card className="p-5">
          <ErrorBanner message={loadError ?? "Settings could not be loaded."} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Configure platform-wide information and payout details"
        actions={
          <Button onClick={() => void handleSave()} loading={saving} disabled={saving}>
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Saved
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        }
      />

      {saveError && <ErrorBanner message={saveError} />}

      <Card className="p-5 space-y-5">
        <div>
          <SectionTitle>Platform info</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Platform name" error={errors.app_name}>
              <input
                value={form.app_name}
                onChange={(e) => set("app_name", e.target.value)}
                placeholder="e.g. Spur Connect"
                className={inputCls}
              />
            </Field>
            <Field label="Contact email" error={errors.app_email}>
              <input
                type="email"
                value={form.app_email}
                onChange={(e) => set("app_email", e.target.value)}
                placeholder="support@yourplatform.com"
                className={inputCls}
              />
            </Field>
            <Field label="Contact phone" error={errors.app_phone}>
              <input
                value={form.app_phone}
                onChange={(e) => set("app_phone", e.target.value)}
                placeholder="0708 xxx xxxx"
                className={inputCls}
              />
            </Field>
            <Field label="Logo URL" error={errors.logo}>
              <input
                value={form.logo}
                onChange={(e) => set("logo", e.target.value)}
                placeholder="https://yourplatform.com/logo.png"
                className={inputCls}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Business address" error={errors.app_address}>
                <input
                  value={form.app_address}
                  onChange={(e) => set("app_address", e.target.value)}
                  placeholder="Street, city, state"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {form.logo ? (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                <img
                  src={form.logo}
                  alt="Logo preview"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Logo preview — shown to customers across the platform.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <ImageIcon className="h-4 w-4" /> No logo set yet.
            </div>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Payout bank details</SectionTitle>
        <p className="mb-4 -mt-2 text-xs text-slate-500">
          The account platform funds are reconciled against. Double-check
          these carefully — an incorrect account number here can misroute
          funding confirmations.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank name" error={errors.bankName}>
            <input
              value={form.bankName}
              onChange={(e) => set("bankName", e.target.value)}
              placeholder="e.g. Opay"
              className={inputCls}
            />
          </Field>
          <Field label="Account name" error={errors.accountName}>
            <input
              value={form.accountName}
              onChange={(e) => set("accountName", e.target.value)}
              placeholder="Account holder name"
              className={inputCls}
            />
          </Field>
          <Field label="Account number" error={errors.accountNumber} hint="10 digits">
            <input
              value={form.accountNumber}
              onChange={(e) => set("accountNumber", e.target.value)}
              placeholder="0123456789"
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
          <Field label="BVN" error={errors.bvn} hint="11 digits">
            <input
              value={form.bvn}
              onChange={(e) => set("bvn", e.target.value)}
              placeholder="12345678901"
              inputMode="numeric"
              className={inputCls}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Environment</SectionTitle>
        <p className="mb-4 -mt-2 text-xs text-slate-500">
          Read-only — sourced from the server's own environment configuration,
          not editable here.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <ReadOnlyField label="App type" value={general.app_type || "—"} />
          <ReadOnlyField label="App URL" value={general.app_url} />
          <ReadOnlyField label="App logo (server default)" value={general.app_logo} />
        </div>
      </Card>
    </div>
  );
}
