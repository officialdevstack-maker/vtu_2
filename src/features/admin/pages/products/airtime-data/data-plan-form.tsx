import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { ChevronLeft, AlertCircle, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { z } from "zod";
import {
  PageHeader,
  Card,
  Button,
  Toggle,
  inputCls,
  selectCls,
  SkeletonLine,
} from "../../../../user/components/shared-ui";
import {
  dataPlanService,
  networkService,
  networkTypeService,
  roleService,
  type DataPlan,
  type Network,
  type Role,
} from "./service";
import { providerService, type Provider } from "../../apis/providerService";

const BACK = "/admin/products/airtime-data?tab=data-plans";
const NEW = "/admin/products/airtime-data/data-plans/new";

// ─── Types ────────────────────────────────────────────────────────────────────

type PriceType = "fiat" | "percentage";

type RolePrice = { type: PriceType; value: string };

type FallbackProviderForm = {
  provider_id: string;
  server_id: string;
  cost_price: string;
};

type FormState = {
  network: string;
  plan_type: string;
  plan_name: string;
  plan_size: string;
  validity: string;
  active: boolean;
  sort_order: string;
  useCustomProvider: boolean;
  provider_id: string;
  server_id: string;
  fallbacks: FallbackProviderForm[];
  cost_price: string;
};

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
        {hint && !error && <span className="text-xs text-slate-400">{hint}</span>}
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
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    const validationErrors = data?.errors;
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      return Object.values(validationErrors).flat().join(" ");
    }
    if (typeof data?.message === "string") {
      return data.message;
    }
    if (err.message) return err.message;
  }
  return "Something went wrong. Please try again.";
}

function NumberInput({
  value,
  onChange,
  placeholder,
  suffix,
  min,
}: {
  value: string | number | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  min?: number;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min={min ?? 0}
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

// A NumberInput whose suffix is itself a fiat/percentage picker, so the
// value and its unit read as one control (₦ / % appended to the number,
// same spot the static currency suffix used to sit).
function RolePriceInput({
  value,
  type,
  onValueChange,
  onTypeChange,
}: {
  value: string;
  type: PriceType;
  onValueChange: (v: string) => void;
  onTypeChange: (t: PriceType) => void;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="0"
        className={`${inputCls} pr-12`}
      />
      <select
        value={type}
        onChange={(e) => onTypeChange(e.target.value as PriceType)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 bg-transparent border-none outline-none cursor-pointer"
      >
        <option value="fiat">₦</option>
        <option value="percentage">%</option>
      </select>
    </div>
  );
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

const SIZE_UNITS = ["MB", "GB"];

const blankForm = (): FormState => ({
  network: "",
  plan_type: "",
  plan_name: "",
  plan_size: "GB",
  validity: "",
  active: true,
  sort_order: "",
  useCustomProvider: false,
  provider_id: "",
  server_id: "",
  fallbacks: [],
  cost_price: "",
});

const fallbackRowsFromPlan = (d: DataPlan): FallbackProviderForm[] => {
  if (Array.isArray(d.fallbacks) && d.fallbacks.length > 0) {
    return d.fallbacks.map((fallback) => ({
      provider_id:
        fallback.provider_id != null ? String(fallback.provider_id) : "",
      server_id: fallback.server_id != null ? String(fallback.server_id) : "",
      cost_price:
        fallback.cost_price != null ? String(fallback.cost_price) : "",
    }));
  }

  if (d.fallback_provider_id == null) {
    return [];
  }

  return [
    {
      provider_id: String(d.fallback_provider_id),
      server_id:
        d.fallback_server_id != null ? String(d.fallback_server_id) : "",
      cost_price:
        d.fallback_cost_price != null ? String(d.fallback_cost_price) : "",
    },
  ];
};

const toForm = (d: DataPlan): FormState => ({
  network: d.network ?? "",
  plan_type: d.plan_type ?? "",
  plan_name: d.plan_name ?? "",
  plan_size: d.plan_size || "GB",
  validity: d.validity ?? "",
  active: d.active ?? true,
  sort_order: d.sort_order != null ? String(d.sort_order) : "",
  useCustomProvider: d.provider_id != null,
  provider_id: d.provider_id != null ? String(d.provider_id) : "",
  server_id:
    d.provider?.pivot?.server_id != null
      ? String(d.provider.pivot.server_id)
      : d.server_id != null
        ? String(d.server_id)
        : "",
  fallbacks: fallbackRowsFromPlan(d),
  cost_price: d.cost_price != null ? String(d.cost_price) : "",
});

// A role's pricing entry may already be a plain legacy fiat number, or the
// new { type, value } shape — normalize either into editable form state.
const toPricingState = (
  pricing: Record<string, unknown> | null | undefined,
): Record<string, RolePrice> => {
  const state: Record<string, RolePrice> = {};
  if (!pricing) return state;
  for (const [role, entry] of Object.entries(pricing)) {
    if (entry && typeof entry === "object") {
      const e = entry as { type?: string; value?: string | number };
      state[role] = {
        type: e.type === "percentage" ? "percentage" : "fiat",
        value: e.value != null ? String(e.value) : "",
      };
    } else {
      state[role] = { type: "fiat", value: entry != null ? String(entry) : "" };
    }
  }
  return state;
};

const toPayload = (
  form: FormState,
  pricing: Record<string, RolePrice>,
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    network: form.network,
    plan_type: form.plan_type,
    plan_name: form.plan_name,
    plan_size: form.plan_size,
    validity: form.validity,
    active: form.active,
    sort_order: form.sort_order !== "" ? Number(form.sort_order) : null,
    pricing: Object.fromEntries(
      Object.entries(pricing)
        .filter(([, p]) => p.value !== "")
        .map(([role, p]) => [role, { type: p.type, value: Number(p.value) }]),
    ),
    use_provider_as_providerable: form.useCustomProvider,
  };

  // Always persist Cost price / Plan ID on the providerable pivot, even when no
  // custom provider is chosen — it's the cost basis for percentage pricing and
  // the plan's id on the fulfilling vendor. provider_id is the ONLY thing that
  // overrides routing (VTUServiceFactory → DataPlan::resolveVendor); it's kept
  // null unless the custom-provider toggle is on, so a plain cost price never
  // re-routes the plan away from Service Routing.
  const fallbacks = form.fallbacks
    .filter((fallback) => fallback.provider_id !== "")
    .map((fallback) => ({
      provider_id: fallback.provider_id,
      server_id: fallback.server_id !== "" ? fallback.server_id : null,
      cost_price:
        fallback.cost_price !== "" ? Number(fallback.cost_price) : null,
    }));
  const firstFallback = fallbacks[0];

  payload.providerable = {
    provider_id: form.useCustomProvider ? form.provider_id || null : null,
    // providerables.server_id is an integer column — must be numeric or null.
    server_id: form.server_id !== "" ? Number(form.server_id) : null,
    fallback_provider_id: firstFallback?.provider_id ?? null,
    fallback_server_id:
      firstFallback?.server_id ?? null,
    // Null, not 0 — blank means "the fallback costs the same as cost_price",
    // whereas 0 would tell the profit calculation the goods were free.
    fallback_cost_price:
      firstFallback?.cost_price ?? null,
    fallbacks,
    cost_price: form.cost_price !== "" ? Number(form.cost_price) : 0,
  };

  return payload;
};

const nonNegativeAmount = z
  .string()
  .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
    message: "Enter a valid non-negative amount.",
  });

const dataPlanFormSchema = z
  .object({
    network: z.string().trim().min(1, { message: "Select a network." }),
    plan_type: z.string().trim().min(1, { message: "Select a type." }),
    plan_name: z
      .string()
      .trim()
      .min(1, { message: "Enter the plan amount." })
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
        message: "Enter a valid positive amount.",
      }),
    plan_size: z.string().trim().min(1, { message: "Select a unit." }),
    validity: z.string().trim().min(1, { message: "Enter the validity." }),
    active: z.boolean(),
    sort_order: nonNegativeAmount,
    useCustomProvider: z.boolean(),
    provider_id: z.string(),
    server_id: nonNegativeAmount,
    fallbacks: z.array(
      z.object({
        provider_id: z.string().trim().min(1, {
          message: "Select a fallback provider.",
        }),
        server_id: nonNegativeAmount.refine((v) => v !== "", {
          message: "Enter the fallback provider's plan ID.",
        }),
        cost_price: nonNegativeAmount,
      }),
    ),
    cost_price: nonNegativeAmount,
  })
  .refine((data) => !data.useCustomProvider || data.provider_id !== "", {
    message: "Select a provider.",
    path: ["provider_id"],
  })
  .superRefine((data, ctx) => {
    const selected = new Set<string>();
    data.fallbacks.forEach((fallback, index) => {
      if (fallback.provider_id === data.provider_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Choose a different fallback provider.",
          path: ["fallbacks", index, "provider_id"],
        });
      }
      if (selected.has(fallback.provider_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fallback providers must not repeat.",
          path: ["fallbacks", index, "provider_id"],
        });
      }
      selected.add(fallback.provider_id);
    });
  });

type BaseFormErrorKey =
  | "network"
  | "plan_type"
  | "plan_name"
  | "plan_size"
  | "validity"
  | "sort_order"
  | "provider_id"
  | "server_id"
  | "cost_price";

type FallbackErrors = Partial<Record<keyof FallbackProviderForm, string>>;

type FormErrors = Partial<Record<BaseFormErrorKey, string>> & {
  fallbacks?: Record<number, FallbackErrors>;
};

function validateForm(form: FormState): FormErrors {
  const result = dataPlanFormSchema.safeParse(form);
  if (result.success) return {};

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    if (issue.path[0] === "fallbacks") {
      const index = Number(issue.path[1]);
      const field = issue.path[2] as keyof FallbackProviderForm | undefined;
      if (Number.isInteger(index) && field) {
        errors.fallbacks = errors.fallbacks ?? {};
        errors.fallbacks[index] = errors.fallbacks[index] ?? {};
        if (!errors.fallbacks[index][field]) {
          errors.fallbacks[index][field] = issue.message;
        }
      }
      continue;
    }

    const key = issue.path[0] as BaseFormErrorKey | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

const priceSchema = z
  .string()
  .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
    message: "Enter a valid non-negative price.",
  });

function validatePrice(v: string): string | undefined {
  const result = priceSchema.safeParse(v);
  return result.success ? undefined : result.error.issues[0]?.message;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DataPlanFormPage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const stateDataPlan = (location.state as { dataPlan?: DataPlan } | null)
    ?.dataPlan;

  const [initial, setInitial] = useState<DataPlan | undefined>(stateDataPlan);
  const [fetchingInitial, setFetchingInitial] = useState(
    id != null && !stateDataPlan,
  );
  const [form, setForm] = useState<FormState>(
    stateDataPlan ? toForm(stateDataPlan) : blankForm(),
  );
  const [networks, setNetworks] = useState<Network[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [pricing, setPricing] = useState<Record<string, RolePrice>>({});
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<"return" | "new">("return");
  const [justSaved, setJustSaved] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    networkService
      .getAll()
      .then(setNetworks)
      .catch(() => {});
    networkTypeService
      .getAll()
      .then((all) => {
        const names = Array.from(
          new Set(
            all
              .filter((t) => t.active && t.service_type === "data")
              .map((t) => t.name),
          ),
        );
        setTypes(names);
      })
      .catch(() => {});
    providerService
      .getAll()
      .then(setProviders)
      .catch(() => {});
    roleService
      .getAll()
      .catch(() => [])
      .then((r) => {
        setRoles(r);
        setRolesLoading(false);
      });
  }, []);

  useEffect(() => {
    if (id && !stateDataPlan) {
      dataPlanService
        .getById(id)
        .then((d) => {
          setInitial(d);
          setForm(toForm(d));
          setPricing(toPricingState(d.pricing));
        })
        .finally(() => setFetchingInitial(false));
    } else if (stateDataPlan?.pricing) {
      setPricing(toPricingState(stateDataPlan.pricing));
    }
  }, [id, stateDataPlan]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) =>
      e[k as BaseFormErrorKey] ? { ...e, [k]: undefined } : e,
    );
  };

  const addFallbackProvider = () => {
    setForm((f) => ({
      ...f,
      fallbacks: [...f.fallbacks, { provider_id: "", server_id: "", cost_price: "" }],
    }));
    setErrors((e) => ({ ...e, fallbacks: undefined }));
  };

  const updateFallbackProvider = (
    index: number,
    field: keyof FallbackProviderForm,
    value: string,
  ) => {
    setForm((f) => ({
      ...f,
      fallbacks: Array.from(
        { length: Math.max(f.fallbacks.length, index + 1) },
        (_, i) => {
          const fallback = f.fallbacks[i] ?? {
            provider_id: "",
            server_id: "",
            cost_price: "",
          };

          return i === index ? { ...fallback, [field]: value } : fallback;
        },
      ),
    }));
    setErrors((e) => ({ ...e, fallbacks: undefined }));
  };

  const removeFallbackProvider = (index: number) => {
    setForm((f) => ({
      ...f,
      fallbacks: f.fallbacks.filter((_, i) => i !== index),
    }));
    setErrors((e) => ({ ...e, fallbacks: undefined }));
  };

  const fallbackProviderOptions = (index: number) => {
    const selectedByOtherRows = new Set(
      form.fallbacks
        .map((fallback, i) => (i === index ? "" : fallback.provider_id))
        .filter(Boolean),
    );

    return providers.filter(
      (provider) =>
        String(provider.id) !== form.provider_id &&
        !selectedByOtherRows.has(String(provider.id)),
    );
  };

  const setPriceValue = (roleName: string, v: string) =>
    setPricing((p) => ({
      ...p,
      [roleName]: { type: p[roleName]?.type ?? "fiat", value: v },
    }));

  const setPriceType = (roleName: string, type: PriceType) =>
    setPricing((p) => ({
      ...p,
      [roleName]: { type, value: p[roleName]?.value ?? "" },
    }));

  const priceErrors: Record<string, string> = {};
  for (const role of roles) {
    const err = validatePrice(pricing[role.name]?.value ?? "");
    if (err) priceErrors[role.name] = err;
  }
  const hasPriceErrors = Object.keys(priceErrors).length > 0;

  const valid = form.network.trim().length > 0 && form.plan_type.trim().length > 0;

  // "return" saves and goes back to the list; "new" saves and reopens a blank
  // form so several plans can be added in a row without a round-trip.
  const handleSubmit = async (after: "return" | "new" = "return") => {
    const formErrors = validateForm(form);
    setErrors(formErrors);
    setSubmitError(
      hasPriceErrors
        ? "Fix the invalid per-role prices before saving."
        : null,
    );
    if (Object.keys(formErrors).length > 0 || hasPriceErrors) return;

    setSaveMode(after);
    setSaving(true);
    try {
      const payload = toPayload(form, pricing) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (initial) {
        await dataPlanService.update(String(initial.id), payload);
      } else {
        await dataPlanService.create(payload);
      }

      if (after === "return") {
        navigate(BACK);
        return;
      }

      // Save & create another. Editing an existing row remounts as a fresh
      // create via the /new route; a blank create form just resets in place.
      if (initial) {
        navigate(NEW);
      } else {
        setForm(blankForm());
        setPricing({});
        setErrors({});
        setSubmitError(null);
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 2500);
      }
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
            {initial ? "Edit data plan" : "New data plan"}
          </div>
        }
        description={
          initial
            ? `Editing ${initial.plan ?? `${initial.plan_name}${initial.plan_size}`} for ${initial.network}`
            : "Configure a new data plan bundle for a network."
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate(BACK)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!valid || saving}
              loading={saving && saveMode === "new"}
              onClick={() => handleSubmit("new")}
            >
              {justSaved ? "Saved ✓" : "Save & new"}
            </Button>
            <Button
              size="sm"
              disabled={!valid || saving}
              loading={saving && saveMode === "return"}
              onClick={() => handleSubmit("return")}
            >
              {initial ? "Save & return" : "Create & return"}
            </Button>
          </>
        }
      />

      {submitError && <ErrorBanner message={submitError} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Left column ── */}
        <div className="space-y-5">
          {/* General */}
          <Card className="p-5">
            <SectionTitle>General</SectionTitle>
            <div className="space-y-4">
              <Field label="Network" error={errors.network}>
                {networks.length > 0 ? (
                  <select
                    value={form.network}
                    onChange={(e) => set("network", e.target.value)}
                    className={selectCls}
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
                    value={form.network}
                    onChange={(e) => set("network", e.target.value)}
                    placeholder="e.g. mtn"
                    className={inputCls}
                  />
                )}
              </Field>

              <Field label="Type" error={errors.plan_type}>
                {types.length > 0 ? (
                  <select
                    value={form.plan_type}
                    onChange={(e) => set("plan_type", e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Select a type</option>
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.plan_type}
                    onChange={(e) => set("plan_type", e.target.value)}
                    placeholder="e.g. sme"
                    className={inputCls}
                  />
                )}
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount" error={errors.plan_name}>
                  <input
                    value={form.plan_name}
                    onChange={(e) => set("plan_name", e.target.value)}
                    placeholder="e.g. 1"
                    className={inputCls}
                  />
                </Field>

                <Field label="Unit" error={errors.plan_size}>
                  <select
                    value={form.plan_size}
                    onChange={(e) => set("plan_size", e.target.value)}
                    className={selectCls}
                  >
                    {SIZE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Validity" error={errors.validity}>
                <input
                  value={form.validity}
                  onChange={(e) => set("validity", e.target.value)}
                  placeholder="e.g. 30 days"
                  className={inputCls}
                />
              </Field>
            </div>
          </Card>

          {/* Settings */}
          <Card className="p-5">
            <SectionTitle>Settings</SectionTitle>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-700">Active</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Make this plan available for purchase.
                  </p>
                </div>
                <Toggle
                  value={Boolean(form.active)}
                  onChange={(v) => set("active", v)}
                />
              </div>

              <Field label="Sort order" hint="optional" error={errors.sort_order}>
                <NumberInput
                  value={form.sort_order}
                  onChange={(v) => set("sort_order", v)}
                  placeholder="0"
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* Provider */}
          <Card className="p-5">
            <SectionTitle>Provider</SectionTitle>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    Route to a specific provider
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Off routes this plan via Service Routing. Cost price still
                    applies either way.
                  </p>
                </div>
                <Toggle
                  value={form.useCustomProvider}
                  onChange={(v) => set("useCustomProvider", v)}
                />
              </div>

              {form.useCustomProvider && (
                <Field label="Primary provider" error={errors.provider_id}>
                  <select
                    value={form.provider_id}
                    onChange={(e) => set("provider_id", e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Select a provider</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {/* Cost price / Plan ID stay editable regardless of the toggle:
                  they're the cost basis for percentage pricing and the plan's
                  id on the fulfilling vendor. Only the Provider above overrides
                  which vendor fulfils the plan. */}
              <Field label="Primary plan ID" hint="optional" error={errors.server_id}>
                <NumberInput
                  value={form.server_id}
                  onChange={(v) => set("server_id", v)}
                  placeholder="Provider's numeric plan ID"
                />
              </Field>

              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                <p className="text-xs font-semibold text-slate-700">
                  Automatic fallbacks
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  Retry these providers in order until one confirms the
                  transaction or returns a pending response.
                </p>
                <button
                  type="button"
                  onClick={addFallbackProvider}
                  className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-amber-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add fallback
                </button>
                <div className="mt-3 space-y-3">
                  <Field
                    label="Fallback provider"
                    hint="optional"
                    error={errors.fallbacks?.[0]?.provider_id}
                  >
                    <select
                      value={form.fallbacks[0]?.provider_id ?? ""}
                      onChange={(e) =>
                        e.target.value === ""
                          ? removeFallbackProvider(0)
                          : updateFallbackProvider(
                              0,
                              "provider_id",
                              e.target.value,
                            )
                      }
                      className={selectCls}
                    >
                      <option value="">No fallback</option>
                      {providers
                        .filter((p) =>
                          fallbackProviderOptions(0).some(
                            (option) => String(option.id) === String(p.id),
                          ),
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                  </Field>

                  {form.fallbacks[0]?.provider_id && (
                    <Field
                      label="Fallback plan ID"
                      error={errors.fallbacks?.[0]?.server_id}
                    >
                      <NumberInput
                        value={form.fallbacks[0]?.server_id ?? ""}
                        onChange={(v) =>
                          updateFallbackProvider(0, "server_id", v)
                        }
                        placeholder="Backup provider's plan ID"
                      />
                    </Field>
                  )}

                  {form.fallbacks[0]?.provider_id && (
                    <Field
                      label="Fallback cost price"
                      hint="leave blank if same as cost price"
                      error={errors.fallbacks?.[0]?.cost_price}
                    >
                      <NumberInput
                        value={form.fallbacks[0]?.cost_price ?? ""}
                        onChange={(v) =>
                          updateFallbackProvider(0, "cost_price", v)
                        }
                        placeholder="Same as cost price"
                        suffix="₦"
                      />
                    </Field>
                  )}

                  {form.fallbacks.slice(1).map((fallback, offset) => {
                    const index = offset + 1;

                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-amber-200 bg-white/70 p-3"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Fallback {index + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeFallbackProvider(index)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove fallback ${index + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="space-y-3">
                          <Field
                            label="Fallback provider"
                            error={errors.fallbacks?.[index]?.provider_id}
                          >
                            <select
                              value={fallback.provider_id}
                              onChange={(e) =>
                                updateFallbackProvider(
                                  index,
                                  "provider_id",
                                  e.target.value,
                                )
                              }
                              className={selectCls}
                            >
                              <option value="">Select a provider</option>
                              {fallbackProviderOptions(index).map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </Field>

                          <Field
                            label="Fallback plan ID"
                            error={errors.fallbacks?.[index]?.server_id}
                          >
                            <NumberInput
                              value={fallback.server_id}
                              onChange={(v) =>
                                updateFallbackProvider(index, "server_id", v)
                              }
                              placeholder="Backup provider's plan ID"
                            />
                          </Field>

                          <Field
                            label="Fallback cost price"
                            hint="leave blank if same as cost price"
                            error={errors.fallbacks?.[index]?.cost_price}
                          >
                            <NumberInput
                              value={fallback.cost_price}
                              onChange={(v) =>
                                updateFallbackProvider(index, "cost_price", v)
                              }
                              placeholder="Same as cost price"
                              suffix="â‚¦"
                            />
                          </Field>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Field
                label="Cost price"
                hint="cost basis for % pricing"
                error={errors.cost_price}
              >
                <NumberInput
                  value={form.cost_price}
                  onChange={(v) => set("cost_price", v)}
                  placeholder="0"
                  suffix="₦"
                />
              </Field>
            </div>
          </Card>

          {/* Pricing by role */}
          <Card className="p-5">
            <SectionTitle>Pricing by role</SectionTitle>
            <p className="text-xs text-slate-400 -mt-2 mb-4">
              Price charged per account role — either a fixed naira amount,
              or a percentage markup over the cost price.
            </p>
            {rolesLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonLine className="h-4 flex-1" />
                    <SkeletonLine className="h-8 w-40" />
                  </div>
                ))}
              </div>
            ) : roles.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">
                No roles found.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {roles.map((role) => {
                  const entry = pricing[role.name] ?? { type: "fiat" as PriceType, value: "" };
                  return (
                    <div
                      key={role.id}
                      className="flex items-center gap-3 py-2.5 first:pt-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">
                          {role.name}
                        </p>
                        {role.description && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {role.description}
                          </p>
                        )}
                      </div>
                      <div className="w-28 shrink-0">
                        <RolePriceInput
                          value={entry.value}
                          type={entry.type}
                          onValueChange={(v) => setPriceValue(role.name, v)}
                          onTypeChange={(t) => setPriceType(role.name, t)}
                        />
                        {priceErrors[role.name] && (
                          <p className="mt-1 text-xs text-red-600">
                            {priceErrors[role.name]}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
