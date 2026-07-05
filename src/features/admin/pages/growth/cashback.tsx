import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import axios from "axios";
import {
  PageHeader,
  Card,
  Button,
  Toggle,
  inputCls,
  SkeletonLine,
} from "../../../user/components/shared-ui";
import { cashbackRateService, type CashbackRate } from "./service";

// service_type values match Transaction::transaction_type (see
// TransactionService::creditCashback) — not the Discount model's "type".
const SERVICE_LABELS: Record<string, string> = {
  airtime_recharge: "Airtime",
  data_subscription: "Data",
  cable_subscription: "Cable TV",
  electricity_bill: "Electricity",
};

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (typeof data?.message === "string") return data.message;
    if (err.message) return err.message;
  }
  return "Something went wrong. Please try again.";
}

function RateRow({ rate, onSaved }: { rate: CashbackRate; onSaved: (r: CashbackRate) => void }) {
  const [value, setValue] = useState(String(rate.percentage ?? ""));
  const [active, setActive] = useState(rate.active);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numeric = Number(value);
  const invalid = value !== "" && (Number.isNaN(numeric) || numeric < 0 || numeric > 100);
  const dirty = value !== String(rate.percentage ?? "") || active !== rate.active;

  const handleSave = async () => {
    if (invalid) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await cashbackRateService.update(rate.id, {
        percentage: value === "" ? 0 : numeric,
        active,
      });
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">
          {SERVICE_LABELS[rate.service_type] ?? rate.service_type}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Credited to the wallet after every successful purchase of this type.
        </p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>

      <Toggle value={active} onChange={setActive} />

      <div className="relative w-24 shrink-0">
        <input
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${inputCls} pr-8 py-2`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
          %
        </span>
      </div>

      <Button
        size="sm"
        variant={saved ? "secondary" : "primary"}
        disabled={saving || invalid || !dirty}
        loading={saving}
        onClick={handleSave}
      >
        {saved ? "Saved" : "Save"}
      </Button>
    </div>
  );
}

export default function CashbackPage() {
  const [rates, setRates] = useState<CashbackRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cashbackRateService
      .getAll()
      .then(setRates)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader
        title="Cashback"
        description="A flat percentage credited to the wallet after a successful purchase, one rate per service — platform-wide, not scoped to a network or role."
      />

      <Card className="p-5">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonLine key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rates.length === 0 ? (
          <div className="py-10 text-center">
            <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No cashback rates configured yet.</p>
          </div>
        ) : (
          <div>
            {rates.map((rate) => (
              <RateRow
                key={rate.id}
                rate={rate}
                onSaved={(updated) =>
                  setRates((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
                }
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
