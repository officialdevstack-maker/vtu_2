import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { ChevronLeft } from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  Toggle,
  inputCls,
  SkeletonLine,
} from "../../../../user/components/shared-ui";
import {
  discountService,
  networkService,
  type Discount,
  type DiscountPayload,
  type Network,
} from "./service";

const BACK = "/admin/products/airtime-data?tab=airtime";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="block text-xs font-medium text-slate-600">{label}</label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: string | number | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min={0}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "0"}
        className={`${inputCls} ${suffix ? "pr-10" : ""}`}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

// ─── Providers config ─────────────────────────────────────────────────────────

const PROVIDERS: { key: keyof DiscountPayload; label: string }[] = [
  { key: "adex_discount", label: "Adex" },
  { key: "spurs_discount", label: "Spurs" },
  { key: "msorg_discount", label: "Msorg" },
  { key: "vtpass_discount", label: "VTpass" },
  { key: "payscribe_discount", label: "Payscribe" },
];

// ─── Form helpers ─────────────────────────────────────────────────────────────

const blankForm = (): DiscountPayload => ({
  network: "",
  category: "",
  type: "",
  min: "",
  max: "",
  adex_discount: "",
  spurs_discount: "",
  msorg_discount: "",
  vtpass_discount: "",
  payscribe_discount: "",
  isActive: true,
});

const toForm = (d: Discount): DiscountPayload => ({
  network: d.network ?? "",
  category: d.category ?? "",
  type: d.type ?? "",
  min: d.min ?? "",
  max: d.max ?? "",
  adex_discount: d.adex_discount ?? "",
  spurs_discount: d.spurs_discount ?? "",
  msorg_discount: d.msorg_discount ?? "",
  vtpass_discount: d.vtpass_discount ?? "",
  payscribe_discount: d.payscribe_discount ?? "",
  isActive: d.isActive ?? d.active ?? true,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscountFormPage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const stateDiscount = (location.state as { discount?: Discount } | null)
    ?.discount;

  const [initial, setInitial] = useState<Discount | undefined>(stateDiscount);
  const [fetchingInitial, setFetchingInitial] = useState(
    id != null && !stateDiscount,
  );
  const [form, setForm] = useState<DiscountPayload>(
    stateDiscount ? toForm(stateDiscount) : blankForm(),
  );
  const [networks, setNetworks] = useState<Network[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    networkService.getAll().then(setNetworks).catch(() => {});
  }, []);

  useEffect(() => {
    if (id && !stateDiscount) {
      discountService
        .getById(id)
        .then((d) => {
          setInitial(d);
          setForm(toForm(d));
        })
        .finally(() => setFetchingInitial(false));
    }
  }, [id, stateDiscount]);

  const set = (k: keyof DiscountPayload, v: string | boolean | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid = String(form.network).trim().length > 0;

  const handleSubmit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      if (initial) {
        await discountService.update(String(initial.id), form);
      } else {
        await discountService.create(form);
      }
      navigate(BACK);
    } finally {
      setSaving(false);
    }
  };

  if (fetchingInitial) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <SkeletonLine className="h-6 w-48" />
          <SkeletonLine className="h-3 w-72" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <Card className="p-5 space-y-4">
              {[...Array(3)].map((_, i) => (
                <SkeletonLine key={i} className="h-8 w-full" />
              ))}
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(BACK)}
              className="p-1 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {initial ? "Edit discount" : "New discount"}
          </div>
        }
        description={
          initial
            ? `Editing discount for ${initial.network}`
            : "Configure a new airtime discount for a network."
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate(BACK)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!valid || saving}
              loading={saving}
              onClick={handleSubmit}
            >
              {initial ? "Save changes" : "Create discount"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Left column ── */}
        <div className="space-y-5">

          {/* General */}
          <Card className="p-5">
            <SectionTitle>General</SectionTitle>
            <div className="space-y-4">
              <Field label="Network">
                {networks.length > 0 ? (
                  <select
                    value={String(form.network)}
                    onChange={(e) => set("network", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select a network</option>
                    {networks.map((n) => (
                      <option key={n.id} value={n.name}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={String(form.network)}
                    onChange={(e) => set("network", e.target.value)}
                    placeholder="e.g. MTN"
                    className={inputCls}
                  />
                )}
              </Field>

              <Field label="Category" hint="optional">
                <input
                  value={String(form.category ?? "")}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="e.g. airtime"
                  className={inputCls}
                />
              </Field>

              <Field label="Type" hint="optional">
                <input
                  value={String(form.type ?? "")}
                  onChange={(e) => set("type", e.target.value)}
                  placeholder="e.g. VTU"
                  className={inputCls}
                />
              </Field>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="p-5">
            <SectionTitle>Pricing</SectionTitle>
            <div className="space-y-4">
              <Field label="Minimum amount" hint="optional">
                <NumberInput
                  value={form.min}
                  onChange={(v) => set("min", v)}
                  placeholder="0"
                  suffix="₦"
                />
              </Field>

              <Field label="Maximum amount" hint="optional">
                <NumberInput
                  value={form.max}
                  onChange={(v) => set("max", v)}
                  placeholder="0"
                  suffix="₦"
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">

          {/* Provider discounts */}
          <Card className="p-5">
            <SectionTitle>Provider discounts</SectionTitle>
            <div className="space-y-4">
              {PROVIDERS.map(({ key, label }) => (
                <Field key={key} label={label} hint="optional">
                  <NumberInput
                    value={form[key] as string | number | null | undefined}
                    onChange={(v) => set(key, v)}
                    placeholder="0"
                    suffix="%"
                  />
                </Field>
              ))}
            </div>
          </Card>

          {/* Settings */}
          <Card className="p-5">
            <SectionTitle>Settings</SectionTitle>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-700">Active</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enable this discount for live transactions.
                </p>
              </div>
              <Toggle
                value={Boolean(form.isActive)}
                onChange={(v) => set("isActive", v)}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
