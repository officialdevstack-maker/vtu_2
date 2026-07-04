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
  SkeletonLine,
} from "../../../../user/components/shared-ui";
import {
  discountService,
  networkService,
  networkTypeService,
  roleService,
  discountRoleService,
  type Discount,
  type Network,
  type Role,
  type DiscountRolePrice,
} from "./service";

const BACK = "/admin/products/airtime-data?tab=airtime";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  category: string;
  type: string;
  min: string;
  max: string;
  active: boolean;
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
// response.data.data.message once unwrapped through the double envelope.
function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { data?: { message?: string; errors?: Record<string, string[]> } }
      | undefined;
    const validationErrors = data?.data?.errors;
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      return Object.values(validationErrors).flat().join(" ");
    }
    if (typeof data?.data?.message === "string") {
      return data.data.message;
    }
    if (err.message) return err.message;
  }
  return "Something went wrong. Please try again.";
}

// Role pricing is a percentage — keep it inside a sane 0–100 range.
function validatePercent(v: string): string | undefined {
  if (v === "") return undefined;
  const n = Number(v);
  if (Number.isNaN(n) || n < 0 || n > 100) return "0–100 only";
  return undefined;
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

// `type` is a fixed DB enum (airtime/exam/electricity/...) — this page only
// ever edits airtime discounts, so it's always "airtime", never user-edited.
const DISCOUNT_TYPE = "airtime";

const blankForm = (): FormState => ({
  name: "",
  category: "",
  type: DISCOUNT_TYPE,
  min: "",
  max: "",
  active: true,
});

const toForm = (d: Discount): FormState => ({
  name: d.name ?? "",
  category: d.category ?? "",
  type: d.type ?? DISCOUNT_TYPE,
  min: d.min != null ? String(d.min) : "",
  max: d.max != null ? String(d.max) : "",
  active: d.active ?? true,
});

const toPayload = (form: FormState): Record<string, unknown> => ({
  name: form.name,
  category: form.category || null,
  type: form.type || DISCOUNT_TYPE,
  min: form.min || null,
  max: form.max || null,
  active: form.active,
});

type FormErrors = Partial<Record<"name" | "min" | "max", string>>;

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Select a network.";
  }

  const min = form.min === "" ? null : Number(form.min);
  const max = form.max === "" ? null : Number(form.max);

  if (form.min !== "" && (min === null || Number.isNaN(min) || min < 0)) {
    errors.min = "Enter a valid non-negative amount.";
  }
  if (form.max !== "" && (max === null || Number.isNaN(max) || max < 0)) {
    errors.max = "Enter a valid non-negative amount.";
  }
  if (!errors.min && !errors.max && min != null && max != null && max < min) {
    errors.max = "Maximum must be greater than or equal to minimum.";
  }

<<<<<<< HEAD
  return errors;
=======
  return payload;
};

// ─── Provider picker ──────────────────────────────────────────────────────────

function ProviderPicker({
  vendors,
  selected,
  discounts,
  onAdd,
  onRemove,
  onDiscountChange,
}: {
  vendors: Provider[];
  selected: string[];
  discounts: Record<string, string>;
  onAdd: (code: string) => void;
  onRemove: (code: string) => void;
  onDiscountChange: (code: string, value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const available = vendors.filter(
    (v) =>
      v.code &&
      !selected.includes(v.code.toLowerCase()) &&
      v.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      {selected.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-2">
          No providers added. Click "Add provider" below to configure discounts.
        </p>
      )}

      {selected.map((code) => {
        const vendor = vendors.find((v) => v.code?.toLowerCase() === code);
        return (
          <div key={code} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">
                {vendor?.name ?? code}
              </p>
              {vendor?.code && vendor.code.toLowerCase() !== vendor.name.toLowerCase() && (
                <p className="text-[10px] text-slate-400">{vendor.code}</p>
              )}
            </div>
            <div className="w-28 shrink-0">
              <NumberInput
                value={discounts[code] ?? ""}
                onChange={(v) => onDiscountChange(code, v)}
                placeholder="0"
                suffix="%"
              />
            </div>
            <button
              onClick={() => onRemove(code)}
              className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors mt-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add provider
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-7 z-20 w-64 bg-white border border-slate-200/70 rounded-xl shadow-md overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search providers..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto py-1">
                {available.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">
                    {vendors.length === 0 ? "Loading providers…" : "All providers added"}
                  </p>
                ) : (
                  available.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        onAdd(v.code!.toLowerCase());
                        setSearch("");
                        setOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <span className="font-medium">{v.name}</span>
                      {v.code && (
                        <span className="ml-1 text-slate-400">({v.code})</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
>>>>>>> 88e37ed236caa72838c204af5b8c71cb2402129b
}

// ─── Role pricing — dynamic per-role discount, own save action ───────────────

function RolePricingSection({
  discountId,
  pendingValues,
  onPendingChange,
}: {
  discountId: string | undefined;
  pendingValues: Record<string, string>;
  onPendingChange: (values: Record<string, string>) => void;
}) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [existing, setExisting] = useState<DiscountRolePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>(pendingValues);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const percentErrors: Record<string, string> = {};
  for (const role of roles) {
    const err = validatePercent(values[String(role.id)] ?? "");
    if (err) percentErrors[String(role.id)] = err;
  }
  const hasPercentErrors = Object.keys(percentErrors).length > 0;

  // Roles always load, even before the discount itself is saved, so a new
  // discount's pricing can be filled in up front instead of only after a
  // save-then-reopen round trip.
  useEffect(() => {
    setLoading(true);
    roleService
      .getAll()
      .catch(() => [])
      .then((roleList) => {
        setRoles(roleList);
        if (!discountId) {
          setLoading(false);
          return;
        }
        discountRoleService
          .getForDiscount(discountId)
          .catch(() => [])
          .then((priceList) => {
            setExisting(priceList);
            const initialValues: Record<string, string> = {};
            for (const p of priceList) {
              initialValues[String(p.role_id)] = String(p.discount ?? "");
            }
            setValues(initialValues);
            onPendingChange(initialValues);
            setLoading(false);
          });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountId]);

  const setValue = (roleId: string, v: string) => {
    setValues((s) => {
      const next = { ...s, [roleId]: v };
      onPendingChange(next);
      return next;
    });
  };

  const handleSave = async () => {
    if (!discountId || hasPercentErrors) return;
    setSaving(true);
    setSaveError(null);
    try {
      await Promise.all(
        roles.map((role) => {
          const roleId = String(role.id);
          const raw = values[roleId] ?? "";
          const found = existing.find((p) => String(p.role_id) === roleId);
          const percent = raw === "" ? 0 : parseFloat(raw);

          if (found) {
            return discountRoleService.update(found.id, { discount: percent });
          }
          return discountRoleService.create({
            discount_id: discountId,
            role_id: role.id,
            discount: percent,
          });
        }),
      );
      const refreshed = await discountRoleService.getForDiscount(discountId);
      setExisting(refreshed);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="">
      <div className="flex items-start justify-between mb-4 p-5">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Pricing by role
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Discount percentage applied when this network is charged, per
            account role. New roles show up here automatically.
          </p>
        </div>
        {discountId && (
          <Button
            size="sm"
            variant={saved ? "secondary" : "primary"}
            disabled={saving || roles.length === 0 || hasPercentErrors}
            loading={saving}
            onClick={handleSave}
          >
            {saved ? "Saved" : "Save pricing"}
          </Button>
        )}
      </div>

      {saveError && (
        <div className="mx-5 mb-4">
          <ErrorBanner message={saveError} />
        </div>
      )}

      {!discountId && roles.length > 0 && !loading && (
        <p className="mx-5 mb-4 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
          These percentages save automatically once you create the discount.
        </p>
      )}

      {loading ? (
        <div className="space-y-3 p-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonLine className="h-4 flex-1" />
              <SkeletonLine className="h-8 w-28" />
            </div>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-2">
          No roles found. Create a role first to price this network for it.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center gap-3 p-5 py-2.5 first:pt-0"
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
                <NumberInput
                  value={values[String(role.id)] ?? ""}
                  onChange={(v) => setValue(String(role.id), v)}
                  placeholder="0"
                  suffix="%"
                />
                {percentErrors[String(role.id)] && (
                  <p className="mt-1 text-xs text-red-600">
                    {percentErrors[String(role.id)]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

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
  const [types, setTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [pendingRolePricing, setPendingRolePricing] = useState<
    Record<string, string>
  >({});
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
              .filter((t) => t.active && t.service_type === "airtime")
              .map((t) => t.name),
          ),
        );
        setTypes(names);
      })
      .catch(() => {});
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

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as keyof FormErrors] ? { ...e, [k]: undefined } : e));
  };

  const valid = String(form.name).trim().length > 0;

  const handleSubmit = async () => {
    const formErrors = validateForm(form);
    const rolePricingInvalid = Object.values(pendingRolePricing).some(
      (v) => validatePercent(v) !== undefined,
    );
    setErrors(formErrors);
    setSubmitError(
      rolePricingInvalid
        ? "Fix the invalid role pricing percentages before saving."
        : null,
    );
    if (Object.keys(formErrors).length > 0 || rolePricingInvalid) return;

    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = toPayload(form) as any;
      if (initial) {
        await discountService.update(String(initial.id), payload);
        navigate(BACK);
      } else {
        // Stay on the page after creating so the "Pricing by role" card
        // becomes usable immediately, instead of bouncing back to the list
        // and forcing a second trip through Edit to set role pricing.
        const created = await discountService.create(payload);

        await Promise.all(
          Object.entries(pendingRolePricing)
            .filter(([, v]) => v !== "")
            .map(([roleId, v]) =>
              discountRoleService.create({
                discount_id: created.id,
                role_id: roleId,
                discount: parseFloat(v),
              }),
            ),
        );

        setInitial(created);
        navigate(`/admin/products/airtime-data/discounts/${created.id}/edit`, {
          replace: true,
          state: { discount: created },
        });
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
            {initial ? "Edit discount" : "New discount"}
          </div>
        }
        description={
          initial
            ? `Editing discount for ${initial.name}`
            : "Configure a new airtime discount for a network."
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
              <Field label="Network" error={errors.name}>
                {networks.length > 0 ? (
                  <select
                    value={String(form.name)}
                    onChange={(e) => set("name", e.target.value)}
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
                    className={inputCls}
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
          <RolePricingSection
            discountId={initial ? String(initial.id) : undefined}
            pendingValues={pendingRolePricing}
            onPendingChange={setPendingRolePricing}
          />

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
