import { useEffect, useMemo, useState } from "react";
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
} from "../../../user/components/shared-ui";
import { networkService, networkTypeService, type Network, type NetworkType } from "../products/airtime-data/service";
import { discountService, type Discount, type DiscountServiceType, type DiscountValueType } from "./service";

const BACK = "/admin/growth/discounts";

const SERVICE_OPTIONS: { value: DiscountServiceType; label: string }[] = [
  { value: "airtime", label: "Airtime" },
  { value: "data", label: "Data" },
  { value: "cable", label: "Cable" },
  { value: "electricity", label: "Electricity" },
  { value: "exam", label: "Exam" },
  { value: "airtimeToCash", label: "Airtime to Cash" },
  { value: "user_upgrade", label: "Account Upgrade" },
];

// Matches CustomerController::upgrade()'s `upgrade_to` enum exactly.
const UPGRADE_TIER_OPTIONS = [
  { value: "user", label: "User" },
  { value: "agent", label: "Agent" },
  { value: "bonanza", label: "Bonanza" },
  { value: "api", label: "API Reseller" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  service_type: DiscountServiceType;
  network: string;
  discount_type: DiscountValueType;
  value: string;
  active: boolean;
  starts_at: string;
  ends_at: string;
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
  max,
}: {
  value: string | number | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  max?: number;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min={0}
        max={max}
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

const blankForm = (): FormState => ({
  name: "",
  service_type: "airtime",
  network: "",
  discount_type: "percentage",
  value: "",
  active: true,
  starts_at: "",
  ends_at: "",
});

const toForm = (d: Discount): FormState => ({
  name: d.name ?? "",
  service_type: d.service_type ?? "airtime",
  network: d.network ?? "",
  discount_type: d.discount_type ?? "percentage",
  value: d.value != null ? String(d.value) : "",
  active: d.active ?? true,
  starts_at: d.starts_at ?? "",
  ends_at: d.ends_at ?? "",
});

const toPayload = (form: FormState) => ({
  name: form.name,
  service_type: form.service_type,
  network: form.network || null,
  discount_type: form.discount_type,
  value: Number(form.value),
  active: form.active,
  starts_at: form.starts_at || null,
  ends_at: form.ends_at || null,
});

const discountFormSchema = z
  .object({
    name: z.string().trim().min(1, { message: "Name is required." }),
    service_type: z.string().min(1, { message: "Select a service." }),
    network: z.string(),
    discount_type: z.enum(["percentage", "fixed"]),
    value: z.string(),
    active: z.boolean(),
    starts_at: z.string(),
    ends_at: z.string(),
  })
  .refine(
    (data) => data.value !== "" && !Number.isNaN(Number(data.value)) && Number(data.value) >= 0,
    { message: "Enter a valid non-negative value.", path: ["value"] },
  )
  .refine(
    (data) => data.discount_type !== "percentage" || Number(data.value) <= 100,
    { message: "A percentage discount can't exceed 100.", path: ["value"] },
  )
  .refine(
    (data) => data.starts_at === "" || data.ends_at === "" || data.ends_at >= data.starts_at,
    {
      message: "End date must be on or after the start date.",
      path: ["ends_at"],
    },
  )
  .refine((data) => data.service_type !== "user_upgrade" || data.network !== "", {
    message: "Select which tier this upgrade cost applies to.",
    path: ["network"],
  });

type FormErrors = Partial<Record<"name" | "service_type" | "value" | "ends_at" | "network", string>>;

function validateForm(form: FormState): FormErrors {
  const result = discountFormSchema.safeParse(form);
  if (result.success) return {};

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof FormErrors | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

// A service that has no clean "network" list to select from yet falls back
// to a free-text input (blank = all) — see growth/discounts.tsx's
// SERVICE_LABELS comment for the same service_type set.
const NETWORK_SOURCE: Partial<Record<DiscountServiceType, "network" | "network_type" | "tier">> = {
  airtime: "network",
  data: "network",
  cable: "network_type",
  user_upgrade: "tier",
};

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
  const [form, setForm] = useState<FormState>(
    stateDiscount ? toForm(stateDiscount) : blankForm(),
  );
  const [networks, setNetworks] = useState<Network[]>([]);
  const [networkTypes, setNetworkTypes] = useState<NetworkType[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    networkService.getAll().then(setNetworks).catch(() => {});
    networkTypeService.getAll().then(setNetworkTypes).catch(() => {});
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

  // What "network" means depends on the selected service: a telecom
  // carrier for airtime/data, a cable provider for cable (dstv/gotv/...,
  // modeled as NetworkType rows), the target account tier for Account
  // Upgrade, or free text for anything else.
  const networkOptions = useMemo(() => {
    const source = NETWORK_SOURCE[form.service_type];
    if (source === "network") {
      return networks.map((n) => ({ value: n.name, label: n.name }));
    }
    if (source === "network_type") {
      return networkTypes
        .filter((t) => t.service_type === form.service_type)
        .map((t) => ({ value: t.name, label: t.name }));
    }
    if (source === "tier") {
      return UPGRADE_TIER_OPTIONS;
    }
    return [];
  }, [form.service_type, networks, networkTypes]);

  const isUpgradeTier = form.service_type === "user_upgrade";

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as keyof FormErrors] ? { ...e, [k]: undefined } : e));
  };

  const setServiceType = (value: DiscountServiceType) => {
    // The network options are a different list per service — a stale
    // selection from the old list wouldn't necessarily mean anything for
    // the new one, so clear it rather than silently keep a mismatched value.
    // Account Upgrade only ever means a flat cost — CustomerController::
    // upgrade() reads `value` as a plain ₦ amount regardless, so lock the
    // type instead of letting the admin pick a meaningless "% off".
    setForm((f) => ({
      ...f,
      service_type: value,
      network: "",
      discount_type: value === "user_upgrade" ? "fixed" : f.discount_type,
    }));
  };

  const valid = form.name.trim().length > 0 && form.value.trim().length > 0;

  const handleSubmit = async () => {
    const formErrors = validateForm(form);
    setErrors(formErrors);
    setSubmitError(null);
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = toPayload(form);
      if (initial) {
        await discountService.update(initial.id, payload);
      } else {
        await discountService.create(payload);
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
            {initial ? "Edit discount" : "New discount"}
          </div>
        }
        description={
          initial
            ? `Editing "${initial.name}"`
            : "Slash pricing for any service, optionally scoped to one network and scheduled to a date window."
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
              {initial ? "Save changes" : "Create discount"}
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
              <Field label="Name" error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Black Friday Data Sale"
                  className={inputCls}
                />
              </Field>

              <Field label="Service" error={errors.service_type}>
                <select
                  value={form.service_type}
                  onChange={(e) => setServiceType(e.target.value as DiscountServiceType)}
                  className={selectCls}
                >
                  {SERVICE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label={isUpgradeTier ? "Upgrade to tier" : "Network"}
                hint={isUpgradeTier ? undefined : "optional — blank = all networks"}
                error={errors.network}
              >
                {networkOptions.length > 0 ? (
                  <select
                    value={form.network}
                    onChange={(e) => set("network", e.target.value)}
                    className={selectCls}
                  >
                    <option value="">{isUpgradeTier ? "Select a tier" : "All networks"}</option>
                    {networkOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.network}
                    onChange={(e) => set("network", e.target.value)}
                    placeholder="blank = all"
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
              {!isUpgradeTier && (
                <Field label="Discount type">
                  <select
                    value={form.discount_type}
                    onChange={(e) => set("discount_type", e.target.value as DiscountValueType)}
                    className={selectCls}
                  >
                    <option value="percentage">Percentage off</option>
                    <option value="fixed">Fixed amount off</option>
                  </select>
                </Field>
              )}

              <Field label={isUpgradeTier ? "Upgrade cost" : "Value"} error={errors.value}>
                <NumberInput
                  value={form.value}
                  onChange={(v) => set("value", v)}
                  placeholder="0"
                  suffix={form.discount_type === "percentage" ? "%" : "₦"}
                  max={form.discount_type === "percentage" ? 100 : undefined}
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* Schedule */}
          <Card className="p-5">
            <SectionTitle>Schedule</SectionTitle>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts" hint="optional — blank = always on">
                  <input
                    type="date"
                    value={form.starts_at}
                    onChange={(e) => set("starts_at", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Ends" hint="optional" error={errors.ends_at}>
                  <input
                    type="date"
                    value={form.ends_at}
                    onChange={(e) => set("ends_at", e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <p className="text-xs text-slate-400">
                Leave both blank for an always-on discount. Set a window to
                run this only for a limited period, e.g. a Black Friday sale.
              </p>
            </div>
          </Card>

          {/* Settings */}
          <Card className="p-5">
            <SectionTitle>Settings</SectionTitle>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-700">Active</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Turn this discount off without deleting it.
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
