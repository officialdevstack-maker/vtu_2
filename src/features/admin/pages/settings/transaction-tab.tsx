import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Trash2, X } from "lucide-react";
import { Card, Button, SkeletonLine, Toggle, inputCls } from "../../../user/components/shared-ui";
import { siteSettingsService, transactionPruningService, type SiteSettings } from "./service";
import {
  serviceControlService,
  type ServiceControlItem,
} from "../serviceControlService";
import { SectionTitle, Field, ErrorBanner, extractErrorMessage } from "./shared";

type FormState = {
  invoice_prefix: string;
  invoice_suffix: string;
  referral_commission_rate: string;
  prune_transactions_enabled: boolean;
  prune_transactions_after_days: string;
  wallet_transfer_min: string;
  wallet_transfer_max: string;
  wallet_withdrawal_auto_approve: boolean;
  wallet_withdrawal_min: string;
  wallet_withdrawal_max: string;
};

const toForm = (s: SiteSettings): FormState => ({
  invoice_prefix: s.invoice_prefix ?? "",
  invoice_suffix: s.invoice_suffix ?? "",
  referral_commission_rate: String(s.referral_commission_rate ?? "0"),
  prune_transactions_enabled: s.prune_transactions_enabled,
  prune_transactions_after_days: String(s.prune_transactions_after_days ?? "365"),
  wallet_transfer_min: String(s.wallet_transfer_min ?? "50"),
  wallet_transfer_max: String(s.wallet_transfer_max ?? "1000000"),
  wallet_withdrawal_auto_approve: s.wallet_withdrawal_auto_approve,
  wallet_withdrawal_min: String(s.wallet_withdrawal_min ?? "500"),
  wallet_withdrawal_max: String(s.wallet_withdrawal_max ?? "500000"),
});

const dateLabel = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-NG", {
        day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
      })
    : "Never";

export function TransactionTab() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [pinControl, setPinControl] = useState<ServiceControlItem | null>(null);
  const [pinLoading, setPinLoading] = useState(true);
  const [pinToggling, setPinToggling] = useState(false);

  const [pruneConfirmCount, setPruneConfirmCount] = useState<number | null>(null);
  const [pruneCheckLoading, setPruneCheckLoading] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [pruneResult, setPruneResult] = useState<string | null>(null);

  useEffect(() => {
    siteSettingsService
      .get()
      .then((s) => {
        setSettings(s);
        setForm(toForm(s));
      })
      .catch((err) => setLoadError(extractErrorMessage(err)))
      .finally(() => setLoading(false));

    serviceControlService
      .getAll()
      .then((groups) => {
        const item = groups.transaction?.transaction?.find((i) => i.name === "pin") ?? null;
        setPinControl(item);
      })
      .finally(() => setPinLoading(false));
  }, []);

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setSaved(false);
  };

  const togglePruneEnabled = () => {
    setForm((f) => (f ? { ...f, prune_transactions_enabled: !f.prune_transactions_enabled } : f));
    setSaved(false);
  };

  const toggleWithdrawalAutoApprove = () => {
    setForm((f) => (f ? { ...f, wallet_withdrawal_auto_approve: !f.wallet_withdrawal_auto_approve } : f));
    setSaved(false);
  };

  const handleTogglePin = async () => {
    if (!pinControl) return;
    setPinToggling(true);
    try {
      await serviceControlService.toggle(pinControl);
      setPinControl((p) => (p ? { ...p, isActive: !p.isActive } : p));
    } finally {
      setPinToggling(false);
    }
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await siteSettingsService.update({
        invoice_prefix: form.invoice_prefix.trim() || "TXN-",
        invoice_suffix: form.invoice_suffix.trim() || null,
        referral_commission_rate: Number(form.referral_commission_rate) || 0,
        prune_transactions_enabled: form.prune_transactions_enabled,
        prune_transactions_after_days: Number(form.prune_transactions_after_days) || 365,
        wallet_transfer_min: Number(form.wallet_transfer_min) || 0,
        wallet_transfer_max: Number(form.wallet_transfer_max) || 0,
        wallet_withdrawal_auto_approve: form.wallet_withdrawal_auto_approve,
        wallet_withdrawal_min: Number(form.wallet_withdrawal_min) || 0,
        wallet_withdrawal_max: Number(form.wallet_withdrawal_max) || 0,
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

  const handleCheckPruneCount = async () => {
    setPruneCheckLoading(true);
    setPruneResult(null);
    try {
      const count = await transactionPruningService.previewCount();
      setPruneConfirmCount(count);
    } finally {
      setPruneCheckLoading(false);
    }
  };

  const handleConfirmPrune = async () => {
    setPruning(true);
    try {
      const pruned = await transactionPruningService.pruneNow();
      setPruneResult(`Pruned ${pruned} transaction${pruned === 1 ? "" : "s"}.`);
      setPruneConfirmCount(null);
      const refreshed = await siteSettingsService.get();
      setSettings(refreshed);
      setForm(toForm(refreshed));
    } finally {
      setPruning(false);
    }
  };

  if (loading || !form) {
    return (
      <Card className="p-5 space-y-4">
        {[...Array(4)].map((_, i) => (
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

      <Card className="p-5">
        <SectionTitle>Security</SectionTitle>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3.5 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">Require PIN for transactions</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Customers must enter their transaction PIN before a purchase goes through.
            </p>
          </div>
          {pinLoading ? (
            <SkeletonLine className="h-5 w-10 rounded-full" />
          ) : pinControl ? (
            <Toggle value={pinControl.isActive} onChange={() => void handleTogglePin()} />
          ) : (
            <span className="text-xs text-slate-400">Not configured</span>
          )}
        </div>
        {pinToggling && <p className="mt-2 text-xs text-slate-400">Saving…</p>}
      </Card>

      <Card className="p-5">
        <SectionTitle>Wallet transfers</SectionTitle>
        <p className="mb-4 -mt-2 text-xs text-slate-500">
          The amount range a customer can send to another user's wallet in one transfer.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum" hint="₦">
            <input
              type="number"
              min={0}
              value={form.wallet_transfer_min}
              onChange={(e) => set("wallet_transfer_min", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Maximum" hint="₦">
            <input
              type="number"
              min={0}
              value={form.wallet_transfer_max}
              onChange={(e) => set("wallet_transfer_max", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Wallet withdrawals</SectionTitle>
        <p className="mb-4 -mt-2 text-xs text-slate-500">
          Real money leaves the platform via the active payment gateway's transfer API.
        </p>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3.5 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">Auto-approve withdrawals</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Off (recommended): requests wait for an admin to approve before payout. On: payout is
              attempted immediately when a customer submits a request, no review step.
            </p>
          </div>
          <Toggle value={form.wallet_withdrawal_auto_approve} onChange={toggleWithdrawalAutoApprove} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Minimum" hint="₦">
            <input
              type="number"
              min={0}
              value={form.wallet_withdrawal_min}
              onChange={(e) => set("wallet_withdrawal_min", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Maximum" hint="₦">
            <input
              type="number"
              min={0}
              value={form.wallet_withdrawal_max}
              onChange={(e) => set("wallet_withdrawal_max", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Invoice numbering</SectionTitle>
        <p className="mb-4 -mt-2 text-xs text-slate-500">
          Applied to references we generate ourselves — manual wallet
          credits/debits and refunds. Vendor-fulfilled purchases (airtime,
          data, etc.) keep the vendor's own reference for reconciliation.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prefix">
            <input
              value={form.invoice_prefix}
              onChange={(e) => set("invoice_prefix", e.target.value)}
              placeholder="TXN-"
              className={inputCls}
            />
          </Field>
          <Field label="Suffix" hint="optional">
            <input
              value={form.invoice_suffix}
              onChange={(e) => set("invoice_suffix", e.target.value)}
              placeholder="e.g. -NG"
              className={inputCls}
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Preview: {form.invoice_prefix || "TXN-"}20260705114500-A1B2C3{form.invoice_suffix}
        </p>
      </Card>

      <Card className="p-5">
        <SectionTitle>Referral commission</SectionTitle>
        <p className="mb-4 -mt-2 text-xs text-slate-500">
          Percentage of a purchase amount credited to whoever referred the buyer,
          the moment their transaction succeeds.
        </p>
        <div className="max-w-xs">
          <Field label="Commission rate" hint="%">
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.referral_commission_rate}
              onChange={(e) => set("referral_commission_rate", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle>Data retention</SectionTitle>
        <p className="mb-4 -mt-2 text-xs text-slate-500">
          Permanently deletes old successful/failed transactions. Pending
          transactions are never touched, regardless of age.
        </p>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3.5 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">Automatically delete old transactions</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Runs daily. Off by default — nothing is deleted unless you turn this on.
            </p>
          </div>
          <Toggle value={form.prune_transactions_enabled} onChange={togglePruneEnabled} />
        </div>

        <div className="mt-4 max-w-xs">
          <Field label="Delete after" hint="days">
            <input
              type="number"
              min={1}
              value={form.prune_transactions_after_days}
              onChange={(e) => set("prune_transactions_after_days", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 px-3.5 py-3">
          <p className="text-xs text-slate-500">
            Last pruned: {dateLabel(settings.transactions_last_pruned_at)}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleCheckPruneCount()}
            loading={pruneCheckLoading}
            disabled={pruneCheckLoading}
          >
            <Trash2 className="w-3.5 h-3.5" /> Prune now
          </Button>
        </div>
        {pruneResult && <p className="mt-2 text-xs text-emerald-600">{pruneResult}</p>}
      </Card>

      {pruneConfirmCount !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-lg">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Prune transactions?</h3>
              <button
                onClick={() => setPruneConfirmCount(null)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex gap-2.5 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">
                  This will permanently delete{" "}
                  <strong>{pruneConfirmCount} transaction{pruneConfirmCount === 1 ? "" : "s"}</strong>{" "}
                  older than {form.prune_transactions_after_days} days. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setPruneConfirmCount(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  disabled={pruning || pruneConfirmCount === 0}
                  loading={pruning}
                  onClick={() => void handleConfirmPrune()}
                >
                  Delete {pruneConfirmCount}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
