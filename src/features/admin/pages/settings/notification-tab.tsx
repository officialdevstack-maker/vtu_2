import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Card, Button, SkeletonLine, Toggle, inputCls } from "../../../user/components/shared-ui";
import {
  siteSettingsService,
  type SiteSettings,
  welcomeMessageService,
  type WelcomeMessage,
} from "./service";
import { SectionTitle, Field, ErrorBanner, extractErrorMessage } from "./shared";

type FormState = {
  notify_admin_on_signup: boolean;
  notify_admin_on_funding: boolean;
  notify_admin_on_large_transaction: boolean;
  large_transaction_threshold: string;
  notify_admin_on_failed_transaction: boolean;
  notify_admin_on_airtime_to_cash: boolean;
  notify_admin_on_wallet_withdrawal: boolean;
};

const toForm = (s: SiteSettings): FormState => ({
  notify_admin_on_signup: s.notify_admin_on_signup,
  notify_admin_on_funding: s.notify_admin_on_funding,
  notify_admin_on_large_transaction: s.notify_admin_on_large_transaction,
  large_transaction_threshold: String(s.large_transaction_threshold ?? "50000"),
  notify_admin_on_failed_transaction: s.notify_admin_on_failed_transaction,
  notify_admin_on_airtime_to_cash: s.notify_admin_on_airtime_to_cash,
  notify_admin_on_wallet_withdrawal: s.notify_admin_on_wallet_withdrawal,
});

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3.5 py-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{hint}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

const blankWelcome = (): WelcomeMessage => ({ id: 0, title: "", body: "", active: true });

export function NotificationTab() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [welcome, setWelcome] = useState<WelcomeMessage>(blankWelcome());
  const [welcomeLoading, setWelcomeLoading] = useState(true);
  const [welcomeSaving, setWelcomeSaving] = useState(false);
  const [welcomeSaved, setWelcomeSaved] = useState(false);
  const [welcomeError, setWelcomeError] = useState<string | null>(null);

  useEffect(() => {
    siteSettingsService
      .get()
      .then((s) => {
        setSettings(s);
        setForm(toForm(s));
      })
      .catch((err) => setLoadError(extractErrorMessage(err)))
      .finally(() => setLoading(false));

    welcomeMessageService
      .get()
      .then((w) => setWelcome(w ?? blankWelcome()))
      .finally(() => setWelcomeLoading(false));
  }, []);

  const toggle = (key: keyof FormState) => {
    setForm((f) => (f ? { ...f, [key]: !f[key] } : f));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await siteSettingsService.update({
        notify_admin_on_signup: form.notify_admin_on_signup,
        notify_admin_on_funding: form.notify_admin_on_funding,
        notify_admin_on_large_transaction: form.notify_admin_on_large_transaction,
        large_transaction_threshold: Number(form.large_transaction_threshold) || 0,
        notify_admin_on_failed_transaction: form.notify_admin_on_failed_transaction,
        notify_admin_on_airtime_to_cash: form.notify_admin_on_airtime_to_cash,
        notify_admin_on_wallet_withdrawal: form.notify_admin_on_wallet_withdrawal,
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

  const handleSaveWelcome = async () => {
    setWelcomeSaving(true);
    setWelcomeError(null);
    try {
      const updated = await welcomeMessageService.update({
        title: welcome.title,
        body: welcome.body,
        active: welcome.active,
      });
      setWelcome(updated);
      setWelcomeSaved(true);
      window.setTimeout(() => setWelcomeSaved(false), 3000);
    } catch (err) {
      setWelcomeError(extractErrorMessage(err));
    } finally {
      setWelcomeSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <Card className="p-5 space-y-4">
        {[...Array(4)].map((_, i) => (
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

      <Card className="p-5 space-y-3">
        <SectionTitle>What emails you</SectionTitle>
        <ToggleRow
          label="New user signup"
          hint="Email me whenever someone creates an account."
          value={form.notify_admin_on_signup}
          onChange={() => toggle("notify_admin_on_signup")}
        />
        <ToggleRow
          label="Wallet funding"
          hint="Email me whenever a customer's wallet is funded."
          value={form.notify_admin_on_funding}
          onChange={() => toggle("notify_admin_on_funding")}
        />
        <ToggleRow
          label="Failed transactions"
          hint="Email me whenever a purchase fails."
          value={form.notify_admin_on_failed_transaction}
          onChange={() => toggle("notify_admin_on_failed_transaction")}
        />
        <ToggleRow
          label="Airtime to cash requests"
          hint="Email me whenever a customer submits a new airtime-to-cash request awaiting review."
          value={form.notify_admin_on_airtime_to_cash}
          onChange={() => toggle("notify_admin_on_airtime_to_cash")}
        />
        <ToggleRow
          label="Wallet withdrawal requests"
          hint="Email me whenever a customer submits a withdrawal awaiting review (only relevant while auto-approve is off)."
          value={form.notify_admin_on_wallet_withdrawal}
          onChange={() => toggle("notify_admin_on_wallet_withdrawal")}
        />
        <div className="rounded-lg border border-gray-200 px-3.5 py-3">
          <ToggleRow
            label="Large transaction alert"
            hint="Email me when a single transaction is at or above the threshold."
            value={form.notify_admin_on_large_transaction}
            onChange={() => toggle("notify_admin_on_large_transaction")}
          />
          {form.notify_admin_on_large_transaction && (
            <div className="mt-3 max-w-xs">
              <Field label="Threshold" hint="₦">
                <input
                  type="number"
                  min={0}
                  value={form.large_transaction_threshold}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, large_transaction_threshold: e.target.value } : f))
                  }
                  className={inputCls}
                />
              </Field>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Sent to the contact email set in General → Platform info.
        </p>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>Welcome message</SectionTitle>
          <Button
            size="sm"
            onClick={() => void handleSaveWelcome()}
            loading={welcomeSaving}
            disabled={welcomeSaving || welcomeLoading}
          >
            {welcomeSaved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>

        {welcomeError && <div className="mb-3"><ErrorBanner message={welcomeError} /></div>}

        {welcomeLoading ? (
          <div className="space-y-3">
            <SkeletonLine className="h-10 w-full" />
            <SkeletonLine className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3.5 py-2.5">
              <p className="text-sm text-slate-700">Shown to customers after login</p>
              <Toggle
                value={welcome.active}
                onChange={() => setWelcome((w) => ({ ...w, active: !w.active }))}
              />
            </div>
            <Field label="Title">
              <input
                value={welcome.title}
                onChange={(e) => setWelcome((w) => ({ ...w, title: e.target.value }))}
                placeholder="Welcome to Vendify!"
                className={inputCls}
              />
            </Field>
            <Field label="Message">
              <textarea
                value={welcome.body}
                onChange={(e) => setWelcome((w) => ({ ...w, body: e.target.value }))}
                placeholder="What's new, what to try first, etc."
                className={`${inputCls} min-h-28 resize-none`}
              />
            </Field>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <SectionTitle>Message templates</SectionTitle>
            <p className="-mt-3 text-xs text-slate-500">
              Per-event email/SMS content (login, register, purchase, wallet
              credit/debit) — manage the full list separately.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/admin/notifications/template")}
          >
            Manage templates <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
