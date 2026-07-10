import { useEffect, useState } from "react";
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

// The services a cashback rate can be set for. These strings must equal the
// Transaction::transaction_type the backend credits against (see
// TransactionService::creditCashback) — note "electric_bill", NOT
// "electricity_bill", or electricity cashback silently never matches.
const SERVICE_TYPES = [
  "airtime_recharge",
  "data_subscription",
  "cable_subscription",
  "electric_bill",
] as const;

const SERVICE_LABELS: Record<string, string> = {
  airtime_recharge: "Airtime",
  data_subscription: "Data",
  cable_subscription: "Cable TV",
  electric_bill: "Electricity",
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
      const payload = { percentage: value === "" ? 0 : numeric, active };
      // No id yet → the rate row doesn't exist in a fresh/wiped DB; create it.
      const updated = rate.id
        ? await cashbackRateService.update(rate.id, payload)
        : await cashbackRateService.create({
            service_type: rate.service_type,
            ...payload,
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
  const [byType, setByType] = useState<Record<string, CashbackRate>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cashbackRateService
      .getAll()
      .then((list) => {
        const map: Record<string, CashbackRate> = {};
        for (const r of list) map[r.service_type] = r;
        setByType(map);
      })
      .finally(() => setLoading(false));
  }, []);

  // Always render one row per service — using the saved rate if present, or a
  // blank (id 0, 0%) placeholder that "Save" creates. This means a fresh or
  // wiped DB shows editable rows instead of an empty, dead-end screen.
  const rows: CashbackRate[] = SERVICE_TYPES.map(
    (type) =>
      byType[type] ?? {
        id: 0,
        service_type: type,
        percentage: 0,
        active: true,
      },
  );

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
        ) : (
          <div>
            {rows.map((rate) => (
              <RateRow
                key={rate.service_type}
                rate={rate}
                onSaved={(updated) =>
                  setByType((prev) => ({
                    ...prev,
                    [updated.service_type]: updated,
                  }))
                }
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
