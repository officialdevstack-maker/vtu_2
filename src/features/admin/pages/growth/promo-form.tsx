import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { ChevronLeft, AlertCircle } from "lucide-react";
import axios from "axios";
import {
  PageHeader,
  Card,
  Button,
  Toggle,
  inputCls,
  selectCls,
  SkeletonLine,
} from "../../../user/components/shared-ui";
import {
  promotionService,
  type Promotion,
  type PromotionApply,
  type PromotionTarget,
  type PromotionProduct,
  type PromotionType,
  type PromotionPayload,
} from "./service";
import {
  roleService,
  networkService,
  type Role,
  type Network,
} from "../products/airtime-data/service";

const BACK = "/admin/growth/promos";

// A readable, shareable promo code — omits ambiguous O/0/I/1.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCode = (len = 8) =>
  Array.from(
    { length: len },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
  ).join("");

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  applyMode: PromotionApply;
  code: string;
  target: PromotionTarget;
  product: PromotionProduct;
  provider: string;
  type: PromotionType;
  value: string;
  active: boolean;
  starts_at: string;
  ends_at: string;
  usage_limit_total: string;
  usage_limit_per_customer: string;
  minAmount: string;
  maxAmount: string;
};

type FormErrors = Partial<Record<"name" | "code" | "value", string>>;

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
        {hint && !error && (
          <span className="text-xs text-slate-400">{hint}</span>
        )}
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

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      { message?: string; errors?: Record<string, string[]> } | undefined;
    const validationErrors = data?.errors;
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      return Object.values(validationErrors).flat().join(" ");
    }
    if (typeof data?.message === "string") return data.message;
    if (err.message) return err.message;
  }
  return "Something went wrong. Please try again.";
}

const blankForm = (): FormState => ({
  name: "",
  applyMode: "code",
  code: "",
  target: "both",
  product: "airtime",
  provider: "",
  type: "percentage",
  value: "",
  active: true,
  starts_at: "",
  ends_at: "",
  usage_limit_total: "",
  usage_limit_per_customer: "",
  minAmount: "",
  maxAmount: "",
});

function toForm(promo: Promotion): FormState {
  const conditions = promo.conditions ?? [];
  const minAmount = conditions.find((c) => c.kind === "min_amount");
  const maxAmount = conditions.find((c) => c.kind === "max_amount");
  return {
    name: promo.name,
    applyMode: promo.apply,
    code: promo.code ?? "",
    target: promo.target,
    product: promo.product,
    provider: promo.provider ?? "",
    type: promo.type,
    value: String(promo.value ?? ""),
    active: promo.active,
    starts_at: promo.starts_at ?? "",
    ends_at: promo.ends_at ?? "",
    usage_limit_total:
      promo.usage_limit_total != null ? String(promo.usage_limit_total) : "",
    usage_limit_per_customer:
      promo.usage_limit_per_customer != null
        ? String(promo.usage_limit_per_customer)
        : "",
    minAmount: minAmount ? String(minAmount.amount) : "",
    maxAmount: maxAmount ? String(maxAmount.amount) : "",
  };
}

function toPayload(form: FormState): PromotionPayload {
  const conditions: PromotionPayload["conditions"] = [];
  if (form.minAmount !== "") {
    conditions.push({ kind: "min_amount", amount: Number(form.minAmount) });
  }
  if (form.maxAmount !== "") {
    conditions.push({ kind: "max_amount", amount: Number(form.maxAmount) });
  }

  return {
    name: form.name.trim(),
    apply: form.applyMode,
    code: form.applyMode === "code" ? form.code.trim() : null,
    target: form.target,
    product: form.product,
    provider: form.provider.trim() || null,
    type: form.type,
    value: Number(form.value),
    active: form.active,
    starts_at: form.starts_at || null,
    ends_at: form.ends_at || null,
    usage_limit_total:
      form.usage_limit_total !== "" ? Number(form.usage_limit_total) : null,
    usage_limit_per_customer:
      form.usage_limit_per_customer !== ""
        ? Number(form.usage_limit_per_customer)
        : null,
    conditions,
  };
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (form.applyMode === "code" && !form.code.trim()) {
    errors.code = "A code is required when apply mode is 'Code'.";
  }
  if (
    form.value === "" ||
    Number.isNaN(Number(form.value)) ||
    Number(form.value) < 0
  ) {
    errors.value = "Enter a valid non-negative value.";
  }
  return errors;
}

const valueSuffix = (type: PromotionType) =>
  type === "percentage" ? "%" : type === "bonus_data" ? "MB" : "₦";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromoFormPage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const statePromotion = (location.state as { promotion?: Promotion } | null)
    ?.promotion;

  const [initial, setInitial] = useState<Promotion | undefined>(statePromotion);
  const [fetchingInitial, setFetchingInitial] = useState(
    id != null && !statePromotion,
  );
  const [form, setForm] = useState<FormState>(
    statePromotion ? toForm(statePromotion) : blankForm(),
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);

  useEffect(() => {
    roleService
      .getAll()
      .then(setRoles)
      .catch(() => {});
    networkService
      .getAll()
      .then(setNetworks)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (id && !statePromotion) {
      promotionService
        .getById(id)
        .then((p) => {
          setInitial(p);
          setForm(toForm(p));
        })
        .finally(() => setFetchingInitial(false));
    }
  }, [id, statePromotion]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as keyof FormErrors] ? { ...e, [k]: undefined } : e));
  };

  const valid = form.name.trim().length > 0;

  // Target audience = a Role (by slug/name); "both" means everyone. Keep any
  // current value that isn't in the fetched list (e.g. a legacy "customer")
  // selectable so editing an old promo doesn't silently drop it.
  const targetOptions = roles.map((r) => ({
    value: String(r.slug ?? r.name),
    label: r.name,
  }));
  const targetIsKnown =
    form.target === "both" ||
    targetOptions.some((o) => o.value === form.target);

  // Provider = a network, stored UPPERCASE to match PromotionService's
  // strtoupper() comparison. "" means all networks.
  const providerOptions = networks.map((n) => n.name.toUpperCase());
  const providerIsKnown =
    form.provider === "" || providerOptions.includes(form.provider);

  const handleSubmit = async () => {
    const formErrors = validateForm(form);
    setErrors(formErrors);
    setSubmitError(null);
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = toPayload(form);
      if (initial) {
        await promotionService.update(initial.id, payload);
      } else {
        await promotionService.create(payload);
      }
      navigate(BACK);
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
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
            {initial ? "Edit promo code" : "New promo code"}
          </div>
        }
        description={
          initial
            ? `Editing "${initial.name}"`
            : "Configure an opt-in code or admin-triggered promotional offer."
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(BACK)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!valid || saving}
              loading={saving}
              onClick={handleSubmit}
            >
              {initial ? "Save changes" : "Create promo"}
            </Button>
          </>
        }
      />

      {submitError && <ErrorBanner message={submitError} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Left column ── */}
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle>General</SectionTitle>
            <div className="space-y-4">
              <Field label="Name" error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. New Year Special 25%"
                  className={inputCls}
                />
              </Field>

              <Field
                label="Apply mode"
                hint="Code = customer enters it; Auto = system-applied"
              >
                <select
                  value={form.applyMode}
                  onChange={(e) =>
                    set("applyMode", e.target.value as PromotionApply)
                  }
                  className={selectCls}
                >
                  <option value="code">
                    Code (customer enters it at checkout)
                  </option>
                  <option value="auto">
                    Auto (applied automatically, no code)
                  </option>
                </select>
              </Field>

              {form.applyMode === "code" && (
                <Field
                  label="Promo code"
                  error={errors.code}
                  hint="Case-insensitive"
                >
                  <div className="flex gap-2">
                    <input
                      value={form.code}
                      onChange={(e) =>
                        set("code", e.target.value.toUpperCase())
                      }
                      placeholder="e.g. NEWYEAR25"
                      className={`${inputCls} font-mono flex-1`}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => set("code", generateCode())}
                    >
                      Generate
                    </Button>
                  </div>
                </Field>
              )}

              <Field label="Active">
                <Toggle
                  value={form.active}
                  onChange={(v) => set("active", v)}
                />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Eligibility</SectionTitle>
            <div className="space-y-4">
              <Field
                label="Target audience"
                hint="which role the promo applies to"
              >
                <select
                  value={form.target}
                  onChange={(e) =>
                    set("target", e.target.value as PromotionTarget)
                  }
                  className={selectCls}
                >
                  <option value="both">All users</option>
                  {targetOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                  {!targetIsKnown && form.target && (
                    <option value={form.target}>{form.target} (legacy)</option>
                  )}
                </select>
              </Field>

              <Field label="Product">
                <select
                  value={form.product}
                  onChange={(e) =>
                    set("product", e.target.value as PromotionProduct)
                  }
                  className={selectCls}
                >
                  <option value="airtime">Airtime</option>
                  <option value="data">Data</option>
                  <option value="bundle">Bundle</option>
                </select>
              </Field>

              <Field
                label="Provider"
                hint="optional — applies to all networks if unset"
              >
                <select
                  value={form.provider}
                  onChange={(e) => set("provider", e.target.value)}
                  className={selectCls}
                >
                  <option value="">All networks</option>
                  {providerOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  {!providerIsKnown && form.provider && (
                    <option value={form.provider}>{form.provider}</option>
                  )}
                </select>
              </Field>
            </div>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle>Offer</SectionTitle>
            <div className="space-y-4">
              <Field label="Type">
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value as PromotionType)}
                  className={selectCls}
                >
                  <option value="percentage">Percentage off</option>
                  <option value="fixed">Fixed amount off</option>
                  <option value="bonus_data">Bonus data (MB)</option>
                  <option value="cashback">Cashback</option>
                </select>
              </Field>

              <Field label="Value" error={errors.value}>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={form.value}
                    onChange={(e) => set("value", e.target.value)}
                    placeholder="0"
                    className={`${inputCls} pr-10`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    {valueSuffix(form.type)}
                  </span>
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Min order amount" hint="optional">
                  <input
                    type="number"
                    min={0}
                    value={form.minAmount}
                    onChange={(e) => set("minAmount", e.target.value)}
                    placeholder="0"
                    className={inputCls}
                  />
                </Field>
                <Field label="Max order amount" hint="optional">
                  <input
                    type="number"
                    min={0}
                    value={form.maxAmount}
                    onChange={(e) => set("maxAmount", e.target.value)}
                    placeholder="0"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Window &amp; limits</SectionTitle>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Starts" hint="optional">
                  <input
                    type="date"
                    value={form.starts_at}
                    onChange={(e) => set("starts_at", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Ends" hint="optional">
                  <input
                    type="date"
                    value={form.ends_at}
                    onChange={(e) => set("ends_at", e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Total usage limit" hint="optional">
                  <input
                    type="number"
                    min={1}
                    value={form.usage_limit_total}
                    onChange={(e) => set("usage_limit_total", e.target.value)}
                    placeholder="Unlimited"
                    className={inputCls}
                  />
                </Field>
                <Field label="Per-customer limit" hint="optional">
                  <input
                    type="number"
                    min={1}
                    value={form.usage_limit_per_customer}
                    onChange={(e) =>
                      set("usage_limit_per_customer", e.target.value)
                    }
                    placeholder="Unlimited"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
