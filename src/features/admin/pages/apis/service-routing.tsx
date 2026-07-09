import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Route as RouteIcon, Info } from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  SkeletonLine,
  selectCls,
} from "../../../user/components/shared-ui";
import { providerService, type Provider } from "./providerService";
import {
  stockVendingService,
  STOCK_VENDING_COLUMNS,
  type StockVending,
  type StockVendingColumn,
  type StockVendingPayload,
} from "./stockVendingService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Mirror the backend: Vendor::scopeProvider matches a routing value against
// provider names case- and separator-insensitively (the seeded default is
// "adex_server_1" while real rows are named "adex server 1").
const normalize = (v: string) =>
  v.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

const extractErrorMessage = (err: unknown): string => {
  const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
  return (
    anyErr?.response?.data?.message ??
    anyErr?.message ??
    "Something went wrong. Please try again."
  );
};

// Which service categories get a routing dropdown, grouped for the form. The
// keys are the stock_vendings columns verbatim (spaces included).
const GROUPS: { title: string; items: { key: StockVendingColumn; label: string }[] }[] = [
  {
    title: "Airtime",
    items: [
      { key: "vtu", label: "VTU (standard airtime)" },
      { key: "sns", label: "SNS" },
    ],
  },
  {
    title: "Data",
    items: [
      { key: "sme", label: "SME" },
      { key: "gifting", label: "Gifting" },
      { key: "cooperate gifting", label: "Corporate Gifting" },
    ],
  },
  {
    title: "Cable TV",
    items: [
      { key: "dstv", label: "DStv" },
      { key: "gotv", label: "GOtv" },
      { key: "startimes", label: "StarTimes" },
    ],
  },
  {
    title: "Recharge & Data Pins",
    items: [
      { key: "data pin", label: "Data Pin" },
      { key: "recharge pin", label: "Recharge Pin" },
    ],
  },
  {
    title: "Other services",
    items: [
      { key: "exam", label: "Exam / Result Checker" },
      { key: "electricity", label: "Electricity" },
      { key: "bulksms", label: "Bulk SMS" },
    ],
  },
];

type FormState = Record<StockVendingColumn, string>;

const blankForm = (): FormState =>
  Object.fromEntries(STOCK_VENDING_COLUMNS.map((c) => [c, ""])) as FormState;

// Resolve each stored routing value to a real vendor name so the dropdown
// shows the right option even when the stored value is a legacy/underscored
// variant. Unmatched values are kept verbatim so nothing is silently lost.
const toForm = (row: StockVending, vendors: Provider[]): FormState => {
  const form = blankForm();
  for (const col of STOCK_VENDING_COLUMNS) {
    const raw = (row[col] ?? "").toString();
    if (!raw) continue;
    const match = vendors.find((v) => normalize(String(v.name)) === normalize(raw));
    form[col] = match ? String(match.name) : raw;
  }
  return form;
};

const toPayload = (form: FormState): StockVendingPayload =>
  Object.fromEntries(
    STOCK_VENDING_COLUMNS.map((c) => [c, form[c].trim()]),
  ) as StockVendingPayload;

// ─── Page ─────────────────────────────────────────────────────────────────────

const ServiceRoutingPage = () => {
  const [vendors, setVendors] = useState<Provider[]>([]);
  const [form, setForm] = useState<FormState>(blankForm());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([providerService.getAll(), stockVendingService.get()])
      .then(([vendorList, row]) => {
        if (cancelled) return;
        setVendors(vendorList);
        setForm(toForm(row, vendorList));
      })
      .catch((err) => !cancelled && setLoadError(extractErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Vendor names present in the current routing that no longer match a
  // configured vendor — surfaced as extra options so the select still shows
  // the real stored value instead of snapping to "Unassigned".
  const orphanValues = useMemo(() => {
    const known = new Set(vendors.map((v) => normalize(String(v.name))));
    const extras = new Set<string>();
    for (const col of STOCK_VENDING_COLUMNS) {
      const v = form[col];
      if (v && !known.has(normalize(v))) extras.add(v);
    }
    return [...extras];
  }, [form, vendors]);

  const set = (key: StockVendingColumn, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await stockVendingService.update(toPayload(form));
      setForm(toForm(updated, vendors));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Service Routing"
        description="Choose which vendor fulfils each service category. Used as the fallback when a specific plan has no provider of its own."
        actions={
          <Button
            onClick={() => void handleSave()}
            loading={saving}
            disabled={saving || loading || vendors.length === 0}
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Saved
              </>
            ) : (
              "Save routing"
            )}
          </Button>
        }
      />

      <div className="flex gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          Purchases first try the provider attached to the specific plan
          (Products → set a custom provider on a plan). Only when a plan has
          none does the transaction fall back to the vendor selected here for
          its category.
        </p>
      </div>

      {saveError && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
          {saveError}
        </div>
      )}

      {loading ? (
        <Card className="p-5 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-10 w-full" />
            </div>
          ))}
        </Card>
      ) : loadError ? (
        <Card className="p-5">
          <div className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
            {loadError}
          </div>
        </Card>
      ) : vendors.length === 0 ? (
        <Card className="overflow-hidden">
          <EmptyState
            icon={RouteIcon}
            title="No vendors configured"
            description="Add at least one API provider before routing services to it."
          />
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {GROUPS.map((group) => (
            <Card key={group.title} className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">
                {group.title}
              </p>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <div key={item.key}>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      {item.label}
                    </label>
                    <select
                      value={form[item.key]}
                      onChange={(e) => set(item.key, e.target.value)}
                      className={selectCls}
                    >
                      <option value="">— Unassigned —</option>
                      {vendors.map((v) => (
                        <option key={String(v.id)} value={String(v.name)}>
                          {v.name}
                        </option>
                      ))}
                      {/* Legacy/unknown stored values kept selectable */}
                      {orphanValues
                        .filter((ov) => ov === form[item.key])
                        .map((ov) => (
                          <option key={ov} value={ov}>
                            {ov} (unknown vendor)
                          </option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceRoutingPage;
