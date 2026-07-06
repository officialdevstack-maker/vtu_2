import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import { z } from "zod";
import { Card, Button, SkeletonLine, inputCls } from "../../../user/components/shared-ui";
import {
  generalService,
  type GeneralSettings,
  type GeneralSettingsPayload,
} from "../generalService";
import { SectionTitle, Field, ErrorBanner, extractErrorMessage, ReadOnlyField } from "./shared";

const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2MB — matches GeneralController::uploadLogo's rule
const LOGO_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

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
  meta_title: string;
  meta_description: string;
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
  meta_title: "",
  meta_description: "",
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
  meta_title: g.meta_title ?? "",
  meta_description: g.meta_description ?? "",
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
  meta_title: form.meta_title.trim() || null,
  meta_description: form.meta_description.trim() || null,
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
  meta_title: z.string(),
  meta_description: z.string(),
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

// ─── Tab ──────────────────────────────────────────────────────────────────────

export function GeneralTab() {
  const [general, setGeneral] = useState<GeneralSettings | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleLogoFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setLogoError(null);

    if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
      setLogoError("Use a JPG, PNG, WebP, or SVG image.");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setLogoError("Image must be 2MB or smaller.");
      return;
    }

    setUploadingLogo(true);
    try {
      const { logo } = await generalService.uploadLogo(file);
      setForm((f) => ({ ...f, logo }));
      setGeneral((g) => (g ? { ...g, logo } : g));
    } catch (err) {
      setLogoError(extractErrorMessage(err));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
      <Card className="p-5 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="h-10 w-full" />
          </div>
        ))}
      </Card>
    );
  }

  if (loadError || !general) {
    return (
      <Card className="p-5">
        <ErrorBanner message={loadError ?? "Settings could not be loaded."} />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => void handleSave()} loading={saving} disabled={saving}>
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Saved
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>

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

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Logo</label>
            <div className="flex items-center gap-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                <img
                  src={form.logo || general.app_logo}
                  alt="Logo preview"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={LOGO_ACCEPTED_TYPES.join(",")}
                  className="hidden"
                  onChange={(e) => void handleLogoFileSelected(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploadingLogo}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? "Uploading..." : (
                    <>
                      <Upload className="w-3.5 h-3.5" /> Upload new logo
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-400 mt-1.5">
                  JPG, PNG, WebP or SVG — up to 2MB. Saved immediately, shown across the platform.
                </p>
                {logoError && <p className="text-xs text-red-600 mt-1">{logoError}</p>}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Browser tab &amp; SEO</SectionTitle>
        <p className="mb-4 -mt-2 text-xs text-slate-500">
          Shown in the browser tab and search/social previews across every
          page. Falls back to the platform name above if left blank.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Page title" error={errors.meta_title} hint="optional">
            <input
              value={form.meta_title}
              onChange={(e) => set("meta_title", e.target.value)}
              placeholder={form.app_name || "e.g. Spur Connect — Airtime, Data & Bills"}
              className={inputCls}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Meta description" error={errors.meta_description} hint="optional, ~160 characters">
              <textarea
                rows={2}
                value={form.meta_description}
                onChange={(e) => set("meta_description", e.target.value)}
                placeholder="A short description shown in search results and social link previews."
                className={`${inputCls} resize-none`}
              />
            </Field>
          </div>
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
