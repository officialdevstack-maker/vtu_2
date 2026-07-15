import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { ChevronLeft, AlertCircle } from "lucide-react";
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
} from "../../../user/components/shared-ui";
import { providerService, type Provider } from "../apis/providerService";
import {
  billPlanService,
  roleService,
  type BillPlan,
  type Role,
} from "./bill-service";

const BACK = "/admin/products/bill";
const NEW = "/admin/products/bill/new";

// ─── Types ────────────────────────────────────────────────────────────────────

type FeeType = "fiat" | "percentage";
type RoleFee = { type: FeeType; value: string };

type FormState = {
  disco: string;
  min: string;
  max: string;
  active: boolean;
  useCustomProvider: boolean;
  provider_id: string;
  server_id: string;
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
        <label className="block text-xs font-medium text-slate-600">{label}</label>
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
    if (typeof data?.message === "string") return data.message;
    if (err.message) return err.message;
  }
  return "Something went wrong. Please try again.";
}

function NumberInput({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min={0}
        value={value}
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
// value and its unit read as one control.
function RoleFeeInput({
  value,
  type,
  onValueChange,
  onTypeChange,
}: {
  value: string;
  type: FeeType;
  onValueChange: (v: string) => void;
  onTypeChange: (t: FeeType) => void;
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
        onChange={(e) => onTypeChange(e.target.value as FeeType)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 bg-transparent border-none outline-none cursor-pointer"
      >
        <option value="fiat">₦</option>
        <option value="percentage">%</option>
      </select>
    </div>
  );
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

const blankForm = (): FormState => ({
  disco: "",
  min: "500",
  max: "100000",
  active: true,
  useCustomProvider: false,
  provider_id: "",
  server_id: "",
});

const toForm = (d: BillPlan): FormState => ({
  disco: d.disco ?? "",
  min: d.min != null ? String(d.min) : "",
  max: d.max != null ? String(d.max) : "",
  active: d.active ?? true,
  useCustomProvider: d.use_provider_as_providerable ?? false,
  provider_id: d.provider?.id != null ? String(d.provider.id) : "",
  server_id: d.provider?.pivot?.server_id != null ? String(d.provider.pivot.server_id) : "",
});

// A role's fee entry — normalize into editable form state.
const toFeeState = (
  fee: Record<string, unknown> | null | undefined,
): Record<string, RoleFee> => {
  const state: Record<string, RoleFee> = {};
  if (!fee) return state;
  for (const [role, entry] of Object.entries(fee)) {
    if (entry && typeof entry === "object") {
      const e = entry as { type?: string; value?: string | number };
      state[role] = {
        type: e.type === "percentage" ? "percentage" : "fiat",
        value: e.value != null ? String(e.value) : "",
      };
    }
  }
  return state;
};

const toPayload = (form: FormState, fee: Record<string, RoleFee>): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    disco: form.disco,
    min: Number(form.min),
    max: Number(form.max),
    active: form.active,
    service_fee: Object.fromEntries(
      Object.entries(fee)
        .filter(([, f]) => f.value !== "")
        .map(([role, f]) => [role, { type: f.type, value: Number(f.value) }]),
    ),
    use_provider_as_providerable: form.useCustomProvider,
  };

  if (form.useCustomProvider) {
    payload.providerable = {
      provider_id: form.provider_id || null,
      server_id: form.server_id !== "" ? Number(form.server_id) : null,
    };
  }

  return payload;
};

const nonNegativeAmount = z
  .string()
  .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
    message: "Enter a valid non-negative amount.",
  });

const billPlanFormSchema = z
  .object({
    disco: z.string().trim().min(1, { message: "Enter the disco name." }),
    min: z
      .string()
      .trim()
      .min(1, { message: "Enter a minimum amount." })
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, {
        message: "Enter a valid non-negative amount.",
      }),
    max: z
      .string()
      .trim()
      .min(1, { message: "Enter a maximum amount." })
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, {
        message: "Enter a valid non-negative amount.",
      }),
    active: z.boolean(),
    useCustomProvider: z.boolean(),
    provider_id: z.string(),
    server_id: nonNegativeAmount,
  })
  .refine((data) => Number(data.max) >= Number(data.min), {
    message: "Maximum must be greater than or equal to minimum.",
    path: ["max"],
  })
  .refine((data) => !data.useCustomProvider || data.provider_id !== "", {
    message: "Select a provider.",
    path: ["provider_id"],
  });

type FormErrors = Partial<Record<"disco" | "min" | "max" | "provider_id" | "server_id", string>>;

function validateForm(form: FormState): FormErrors {
  const result = billPlanFormSchema.safeParse(form);
  if (result.success) return {};

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof FormErrors | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

const feeSchema = nonNegativeAmount;

function validateFee(v: string): string | undefined {
  const result = feeSchema.safeParse(v);
  return result.success ? undefined : result.error.issues[0]?.message;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillPlanFormPage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const stateBillPlan = (location.state as { billPlan?: BillPlan } | null)?.billPlan;

  const [initial, setInitial] = useState<BillPlan | undefined>(stateBillPlan);
  const [fetchingInitial, setFetchingInitial] = useState(id != null && !stateBillPlan);
  const [form, setForm] = useState<FormState>(stateBillPlan ? toForm(stateBillPlan) : blankForm());
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [fee, setFee] = useState<Record<string, RoleFee>>({});
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<"return" | "new">("return");
  const [justSaved, setJustSaved] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    roleService
      .getAll()
      .catch(() => [])
      .then((r) => {
        setRoles(r);
        setRolesLoading(false);
      });
    providerService
      .getAll()
      .then(setProviders)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (id && !stateBillPlan) {
      billPlanService
        .getById(id)
        .then((d) => {
          setInitial(d);
          setForm(toForm(d));
          setFee(toFeeState(d.service_fee));
        })
        .finally(() => setFetchingInitial(false));
    } else if (stateBillPlan?.service_fee) {
      setFee(toFeeState(stateBillPlan.service_fee));
    }
  }, [id, stateBillPlan]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as keyof FormErrors] ? { ...e, [k]: undefined } : e));
  };

  const setFeeValue = (roleName: string, v: string) =>
    setFee((p) => ({ ...p, [roleName]: { type: p[roleName]?.type ?? "fiat", value: v } }));

  const setFeeType = (roleName: string, type: FeeType) =>
    setFee((p) => ({ ...p, [roleName]: { type, value: p[roleName]?.value ?? "" } }));

  const feeErrors: Record<string, string> = {};
  for (const role of roles) {
    const err = validateFee(fee[role.name]?.value ?? "");
    if (err) feeErrors[role.name] = err;
  }
  const hasFeeErrors = Object.keys(feeErrors).length > 0;

  const valid = form.disco.trim().length > 0;

  const handleSubmit = async (after: "return" | "new" = "return") => {
    const formErrors = validateForm(form);
    setErrors(formErrors);
    setSubmitError(hasFeeErrors ? "Fix the invalid per-role service fees before saving." : null);
    if (Object.keys(formErrors).length > 0 || hasFeeErrors) return;

    setSaveMode(after);
    setSaving(true);
    try {
      const payload = toPayload(form, fee) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (initial) {
        await billPlanService.update(String(initial.id), payload);
      } else {
        await billPlanService.create(payload);
      }

      if (after === "return") {
        navigate(BACK);
        return;
      }
      // Save & create another (see data-plan-form for the rationale).
      if (initial) {
        navigate(NEW);
      } else {
        setForm(blankForm());
        setFee({});
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
          <div className="h-6 w-48 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-72 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <Card className="p-5 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 w-full bg-slate-100 rounded animate-pulse" />
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
            {initial ? "Edit bill plan" : "New bill plan"}
          </div>
        }
        description={
          initial
            ? `Editing "${initial.disco}"`
            : "Add a disco with its purchasable amount range and a per-role service fee."
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
          <Card className="p-5">
            <SectionTitle>General</SectionTitle>
            <div className="space-y-4">
              <Field label="Disco" error={errors.disco}>
                <input
                  value={form.disco}
                  onChange={(e) => set("disco", e.target.value)}
                  placeholder="e.g. Ikeja Electric"
                  className={inputCls}
                />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Provider</SectionTitle>
            <p className="text-xs text-slate-400 -mt-2 mb-4">
              Which vendor handles this disco, and its own numeric ID for
              it — no cost price here, since electricity is pay-any-amount.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-700">Attach a provider</p>
                  <p className="text-xs text-slate-400 mt-0.5">Required to purchase this disco live.</p>
                </div>
                <Toggle
                  value={form.useCustomProvider}
                  onChange={(v) => set("useCustomProvider", v)}
                />
              </div>

              {form.useCustomProvider && (
                <>
                  <Field label="Provider" error={errors.provider_id}>
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

                  <Field label="Disco ID" hint="optional" error={errors.server_id}>
                    <NumberInput
                      value={form.server_id}
                      onChange={(v) => set("server_id", v)}
                      placeholder="Provider's numeric ID for this disco"
                    />
                  </Field>
                </>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Amount range</SectionTitle>
            <p className="text-xs text-slate-400 -mt-2 mb-4">
              Electricity is pay-any-amount, not a fixed catalog price — this
              is the range the customer can enter, same as an Airtime Plan.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Minimum" error={errors.min}>
                <NumberInput value={form.min} onChange={(v) => set("min", v)} placeholder="500" suffix="₦" />
              </Field>
              <Field label="Maximum" error={errors.max}>
                <NumberInput value={form.max} onChange={(v) => set("max", v)} placeholder="100000" suffix="₦" />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Settings</SectionTitle>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-700">Active</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enable this disco for live bill payments.
                </p>
              </div>
              <Toggle value={Boolean(form.active)} onChange={(v) => set("active", v)} />
            </div>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle>Service fee</SectionTitle>
            <p className="text-xs text-slate-400 -mt-2 mb-4">
              Added on top of whatever amount the customer chooses to pay,
              per account role — either a fixed naira amount, or a
              percentage of that amount.
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
              <p className="text-xs text-slate-400 text-center py-2">No roles found.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {roles.map((role) => {
                  const entry = fee[role.name] ?? { type: "fiat" as FeeType, value: "" };
                  return (
                    <div key={role.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{role.name}</p>
                        {role.description && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {role.description}
                          </p>
                        )}
                      </div>
                      <div className="w-28 shrink-0">
                        <RoleFeeInput
                          value={entry.value}
                          type={entry.type}
                          onValueChange={(v) => setFeeValue(role.name, v)}
                          onTypeChange={(t) => setFeeType(role.name, t)}
                        />
                        {feeErrors[role.name] && (
                          <p className="mt-1 text-xs text-red-600">{feeErrors[role.name]}</p>
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
