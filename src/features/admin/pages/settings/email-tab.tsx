import { useEffect, useState } from "react";
import { CheckCircle2, Info } from "lucide-react";
import { Card, Button, SkeletonLine, inputCls, selectCls } from "../../../user/components/shared-ui";
import { siteSettingsService, type SiteSettings, type SiteSettingsPayload } from "./service";
import { SectionTitle, Field, ErrorBanner, extractErrorMessage } from "./shared";

type FormState = {
  mail_mailer: string;
  mail_host: string;
  mail_port: string;
  mail_username: string;
  mail_password: string;
  mail_encryption: string;
  mail_from_address: string;
  mail_from_name: string;
};

const toForm = (s: SiteSettings): FormState => ({
  mail_mailer: s.mail_mailer ?? "",
  mail_host: s.mail_host ?? "",
  mail_port: s.mail_port ?? "",
  mail_username: s.mail_username ?? "",
  mail_password: "",
  mail_encryption: s.mail_encryption ?? "",
  mail_from_address: s.mail_from_address ?? "",
  mail_from_name: s.mail_from_name ?? "",
});

export function EmailTab() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    siteSettingsService
      .get()
      .then((s) => {
        setSettings(s);
        setForm(toForm(s));
      })
      .catch((err) => setLoadError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload: SiteSettingsPayload = {
        mail_mailer: form.mail_mailer.trim() || null,
        mail_host: form.mail_host.trim() || null,
        mail_port: form.mail_port.trim() || null,
        mail_username: form.mail_username.trim() || null,
        mail_encryption: form.mail_encryption.trim() || null,
        mail_from_address: form.mail_from_address.trim() || null,
        mail_from_name: form.mail_from_name.trim() || null,
      };
      // Write-only: only send a new password if the admin actually typed one.
      if (form.mail_password.trim()) {
        payload.mail_password = form.mail_password.trim();
      }
      const updated = await siteSettingsService.update(payload);
      setSettings(updated);
      setForm(toForm(updated));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
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

  if (loadError || !settings) {
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

      <div className="flex items-start gap-2 rounded-lg border border-[#111827]/15 bg-[#111827]/10 px-3.5 py-2.5 text-xs text-[#111827]">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          These override the server's .env mail configuration on every request.
          Leave a field blank to keep using whatever the server is already
          configured with.
        </span>
      </div>

      <Card className="p-5">
        <SectionTitle>Provider</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mailer" hint="e.g. smtp">
            <select
              value={form.mail_mailer}
              onChange={(e) => set("mail_mailer", e.target.value)}
              className={selectCls}
            >
              <option value="">Use server default</option>
              <option value="smtp">SMTP</option>
              <option value="ses">Amazon SES</option>
              <option value="log">Log only (dev)</option>
            </select>
          </Field>
          {form.mail_mailer !== "ses" && (
            <Field label="Encryption">
              <select
                value={form.mail_encryption}
                onChange={(e) => set("mail_encryption", e.target.value)}
                className={selectCls}
              >
                <option value="">Use server default</option>
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="none">None</option>
              </select>
            </Field>
          )}
          {form.mail_mailer === "ses" ? (
            <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                SES ships mail using the server's own AWS credentials — set{" "}
                <code className="font-mono">AWS_ACCESS_KEY_ID</code>,{" "}
                <code className="font-mono">AWS_SECRET_ACCESS_KEY</code>, and{" "}
                <code className="font-mono">AWS_DEFAULT_REGION</code> in the server's <code className="font-mono">.env</code>{" "}
                (not here — these are infrastructure secrets, kept out of the database on purpose). The From address below must
                be a verified identity in that SES account/region.
              </span>
            </div>
          ) : (
            <>
              <Field label="SMTP host">
                <input
                  value={form.mail_host}
                  onChange={(e) => set("mail_host", e.target.value)}
                  placeholder="smtp.mailgun.org"
                  className={inputCls}
                />
              </Field>
              <Field label="SMTP port">
                <input
                  value={form.mail_port}
                  onChange={(e) => set("mail_port", e.target.value)}
                  placeholder="587"
                  inputMode="numeric"
                  className={inputCls}
                />
              </Field>
              <Field label="Username">
                <input
                  value={form.mail_username}
                  onChange={(e) => set("mail_username", e.target.value)}
                  placeholder="postmaster@yourdomain.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Password" hint="write-only">
                <input
                  type="password"
                  value={form.mail_password}
                  onChange={(e) => set("mail_password", e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                  className={inputCls}
                />
              </Field>
            </>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Sender identity</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From address">
            <input
              type="email"
              value={form.mail_from_address}
              onChange={(e) => set("mail_from_address", e.target.value)}
              placeholder="no-reply@yourplatform.com"
              className={inputCls}
            />
          </Field>
          <Field label="From name">
            <input
              value={form.mail_from_name}
              onChange={(e) => set("mail_from_name", e.target.value)}
              placeholder="Vendify"
              className={inputCls}
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}
