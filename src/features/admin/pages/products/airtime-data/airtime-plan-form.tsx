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
} from "../../../../user/components/shared-ui";
import { networkService, networkTypeService, airtimePlanService, type Network, type AirtimePlan } from "./service";
import { providerService, type Provider } from "../../apis/providerService";

const BACK = "/admin/products/airtime-data?tab=airtime";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  category: string;
  type: string;
  min: string;
  max: string;
  active: boolean;
  useCustomProvider: boolean;
  provider_id: string;
  server_id: string;
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

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

// Every backend failure here is either a validation-shaped 4xx or the
// generic `fail()` 500 wrapper — both put a human-readable string at
// response.data.message once unwrapped through the (single) envelope.
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

// ─── Form helpers ─────────────────────────────────────────────────────────────

// `type` is a fixed value — this page only ever edits airtime plans, so it's
// always "airtime", never user-edited.
const PLAN_TYPE = "airtime";

const blankForm = (): FormState => ({
  name: "",
  category: "",
  type: PLAN_TYPE,
  min: "",
  max: "",
  active: true,
  useCustomProvider: false,
  provider_id: "",
  server_id: "",
  cost_price: "",
});

const toForm = (d: AirtimePlan): FormState => ({
  name: d.name ?? "",
  category: d.category ?? "",
  type: d.type ?? PLAN_TYPE,
  min: d.min != null ? String(d.min) : "",
  max: d.max != null ? String(d.max) : "",
  active: d.active ?? true,
  useCustomProvider: Boolean(d.use_provider_as_providerable ?? d.provider?.id != null),
  provider_id: d.provider?.id != null ? String(d.provider.id) : d.provider_id != null ? String(d.provider_id) : "",
  server_id:
    d.provider?.pivot?.server_id != null
      ? String(d.provider.pivot.server_id)
      : d.server_id != null
        ? String(d.server_id)
        : "",
  cost_price:
    d.provider?.pivot?.cost_price != null
      ? String(d.provider.pivot.cost_price)
      : d.cost_price != null
        ? String(d.cost_price)
        : "",
});

const toPayload = (form: FormState): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    name: form.name,
    category: form.category || null,
    type: form.type || PLAN_TYPE,
    min: form.min || null,
    max: form.max || null,
    active: form.active,
    use_provider_as_providerable: form.useCustomProvider,
  };

  if (form.useCustomProvider) {
    payload.providerable = {
      provider_id: form.provider_id || null,
      // providerables.server_id is an integer column — must be numeric or null.
      server_id: form.server_id !== "" ? Number(form.server_id) : null,
      cost_price: form.cost_price !== "" ? Number(form.cost_price) : 0,
    };
  }

  return payload;
};

const amountSchema = z
  .string()
  .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), {
    message: "Enter a valid non-negative amount.",
  });

const planFormSchema = z
  .object({
    name: z.string().trim().min(1, { message: "Select a network." }),
    category: z.string(),
    type: z.string(),
    min: amountSchema,
    max: amountSchema,
    active: z.boolean(),
    useCustomProvider: z.boolean(),
    provider_id: z.string(),
    server_id: amountSchema,
    cost_price: amountSchema,
  })
  .refine(
    (data) =>
      data.min === "" || data.max === "" || Number(data.max) >= Number(data.min),
    {
      message: "Maximum must be greater than or equal to minimum.",
      path: ["max"],
    },
  )
  .refine((data) => !data.useCustomProvider || data.provider_id !== "", {
    message: "Select a provider.",
    path: ["provider_id"],
  });

type FormErrors = Partial<Record<"name" | "min" | "max" | "provider_id" | "server_id" | "cost_price", string>>;

function validateForm(form: FormState): FormErrors {
  const result = planFormSchema.safeParse(form);
  if (result.success) return {};

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof FormErrors | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AirtimePlanFormPage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const statePlan = (location.state as { plan?: AirtimePlan } | null)
    ?.plan;

  const [initial, setInitial] = useState<AirtimePlan | undefined>(statePlan);
  const [fetchingInitial, setFetchingInitial] = useState(
    id != null && !statePlan,
  );
  const [form, setForm] = useState<FormState>(
    statePlan ? toForm(statePlan) : blankForm(),
  );
  const [networks, setNetworks] = useState<Network[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    providerService
      .getAll()
      .then(setProviders)
      .catch(() => {});
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
              .filter((t) => t.active && t.service_type === "airtime")
              .map((t) => t.name),
          ),
        );
        setTypes(names);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (id && !statePlan) {
      airtimePlanService
        .getById(id)
        .then((d) => {
          setInitial(d);
          setForm(toForm(d));
        })
        .finally(() => setFetchingInitial(false));
    }
  }, [id, statePlan]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as keyof FormErrors] ? { ...e, [k]: undefined } : e));
  };

  const valid = String(form.name).trim().length > 0;

  const handleSubmit = async () => {
    const formErrors = validateForm(form);
    setErrors(formErrors);
    setSubmitError(null);
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = toPayload(form) as any;
      if (initial) {
        await airtimePlanService.update(String(initial.id), payload);
      } else {
        await airtimePlanService.create(payload);
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
            {initial ? "Edit airtime plan" : "New airtime plan"}
          </div>
        }
        description={
          initial
            ? `Editing airtime plan for ${initial.name}`
            : "Configure a new airtime plan for a network."
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
              {initial ? "Save changes" : "Create airtime plan"}
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
              <Field label="Network" error={errors.name}>
                {networks.length > 0 ? (
                  <select
                    value={String(form.name)}
                    onChange={(e) => set("name", e.target.value)}
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
                    value={String(form.name)}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. MTN"
                    className={inputCls}
                  />
                )}
              </Field>

              <Field label="Type" hint="optional">
                {types.length > 0 ? (
                  <select
                    value={String(form.category ?? "")}
                    onChange={(e) => set("category", e.target.value)}
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
                    value={String(form.category ?? "")}
                    onChange={(e) => set("category", e.target.value)}
                    placeholder="e.g. VTU"
                    className={inputCls}
                  />
                )}
              </Field>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="p-5">
            <SectionTitle>Pricing</SectionTitle>
            <div className="space-y-4">
              <Field label="Minimum amount" hint="optional" error={errors.min}>
                <NumberInput
                  value={form.min}
                  onChange={(v) => set("min", v)}
                  placeholder="0"
                  suffix="₦"
                />
              </Field>

              <Field label="Maximum amount" hint="optional" error={errors.max}>
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
          {/* Provider */}
          <Card className="p-5">
            <SectionTitle>Provider</SectionTitle>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    Use a specific provider
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Off uses the network's default provider instead.
                  </p>
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
                </>
              )}
            </div>
          </Card>

          {/* Settings */}
          <Card className="p-5">
            <SectionTitle>Settings</SectionTitle>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-700">Active</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enable this airtime plan for live transactions.
                </p>
              </div>
              <Toggle
                value={Boolean(form.active)}
                onChange={(v) => set("active", v)}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
