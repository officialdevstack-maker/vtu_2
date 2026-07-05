import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, Button, SkeletonLine, Toggle, inputCls } from "../../../user/components/shared-ui";
import { siteSettingsService, type SiteSettings } from "./service";
import { SectionTitle, Field, ErrorBanner, extractErrorMessage } from "./shared";

type FormState = {
  registrations_open: boolean;
  signup_bonus_amount: string;
  min_wallet_funding_amount: string;
};

const toForm = (s: SiteSettings): FormState => ({
  registrations_open: s.registrations_open,
  signup_bonus_amount: String(s.signup_bonus_amount ?? "0"),
  min_wallet_funding_amount: String(s.min_wallet_funding_amount ?? "0"),
});

export function CustomerTab() {
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

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await siteSettingsService.update({
        registrations_open: form.registrations_open,
        signup_bonus_amount: Number(form.signup_bonus_amount) || 0,
        min_wallet_funding_amount: Number(form.min_wallet_funding_amount) || 0,
      });
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
        {[...Array(3)].map((_, i) => (
          <SkeletonLine key={i} className="h-12 w-full" />
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

      <Card className="p-5">
        <SectionTitle>Registration</SectionTitle>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3.5 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">Allow new registrations</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Turn off to temporarily stop new signups platform-wide.
            </p>
          </div>
          <Toggle
            value={form.registrations_open}
            onChange={() =>
              setForm((f) => (f ? { ...f, registrations_open: !f.registrations_open } : f))
            }
          />
        </div>

        <div className="mt-4 max-w-xs">
          <Field label="Signup bonus" hint="₦, credited automatically">
            <input
              type="number"
              min={0}
              value={form.signup_bonus_amount}
              onChange={(e) =>
                setForm((f) => (f ? { ...f, signup_bonus_amount: e.target.value } : f))
              }
              className={inputCls}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Wallet funding</SectionTitle>
        <div className="max-w-xs">
          <Field label="Minimum funding amount" hint="₦">
            <input
              type="number"
              min={0}
              value={form.min_wallet_funding_amount}
              onChange={(e) =>
                setForm((f) => (f ? { ...f, min_wallet_funding_amount: e.target.value } : f))
              }
              className={inputCls}
            />
          </Field>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            This is saved, but there's no self-service "fund my wallet"
            endpoint wired up yet to actually enforce it — wallet funding
            currently only happens via admin manual credit or a payment
            gateway webhook.
          </span>
        </div>
      </Card>
    </div>
  );
}
