import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { ChevronLeft, X } from "lucide-react";
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
  type Network,
} from "./service";

const BACK = "/admin/products/airtime-data?tab=airtime";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  category: string;
  type: string;
  min: string;
  max: string;
  isActive: boolean;
  userDiscount: string;
  agentDiscount: string;
  apiDiscount: string;
  bonanzaDiscount: string;
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
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="block text-xs font-medium text-slate-600">
          {label}
        </label>
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

// ─── Form helpers ─────────────────────────────────────────────────────────────

const blankForm = (): FormState => ({
  name: "",
  category: "",
  type: "",
  min: "",
  max: "",
  isActive: true,
  vendorDiscounts: {},
});

const toForm = (d: Discount): FormState => {
  console.log({ d });
  const vendorDiscounts: Record<string, string> = {};

  for (const [key, value] of Object.entries(d)) {
    if (value == null || value === "") continue;
    if (!key.startsWith("role_") && key.endsWith("_discount")) {
      const code = key.slice(0, -"_discount".length);
      vendorDiscounts[code] = String(value);
    }
  }

  return {
    name: d.name ?? "",
    category: d.category ?? "",
    type: d.type ?? "",
    min: d.min != null ? String(d.min) : "",
    max: d.max != null ? String(d.max) : "",
    isActive: d.isActive ?? d.active ?? true,
    vendorDiscounts,
  };
};

const extractRoleDiscounts = (d: Discount): Record<string, string> => {
  const roleDiscounts: Record<string, string> = {};
  for (const [key, value] of Object.entries(d)) {
    if (value == null || value === "") continue;
    if (key.startsWith("role_") && key.endsWith("_discount")) {
      const roleId = key.slice("role_".length, -"_discount".length);
      roleDiscounts[roleId] = String(value);
    }
  }
  return roleDiscounts;
};

const toPayload = (form: FormState): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    network: form.name,
    category: form.category || null,
    type: form.type || null,
    min: form.min || null,
    max: form.max || null,
    isActive: form.isActive,
  };

  for (const [code, value] of Object.entries(form.vendorDiscounts)) {
    if (value !== "") payload[`${code}_discount`] = parseFloat(value);
  }

  return payload;
};

// ─── Provider picker ──────────────────────────────────────────────────────────

function ProviderPicker({
  vendors,
  selected,
  onAdd,
  onRemove,
}: {
  vendors: Provider[];
  selected: string[];
  discounts: Record<string, string>;
  onAdd: (code: string) => void;
  onRemove: (code: string) => void;
  onDiscountChange: (code: string, value: string) => void;
}) {
  console.log({ vendors, selected });
  const selectedCode = selected[0] ?? "";

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedCode}
        onChange={(e) => {
          if (e.target.value) onAdd(e.target.value);
          else if (selectedCode) onRemove(selectedCode);
        }}
        className={`${inputCls} flex-1 min-w-0`}
      >
        <option value="">
          {vendors.length === 0 ? "Loading providers…" : "Select a provider…"}
        </option>
        {vendors
          .filter((v) => v.name)
          .map((v) => (
            <option key={v.id} value={v.name!.toLowerCase()}>
              {v.name}
            </option>
          ))}
      </select>
    </div>
  );
}

// ─── Role discounts — separate section with its own save ─────────────────────

function RoleDiscountsSection({
  discountId,
  initialValues,
}: {
  discountId: string | undefined;
  initialValues: Record<string, string>;
}) {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [discounts, setDiscounts] =
    useState<Record<string, string>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient
      .get("/admin/roles")
      .then((r) => {
        const raw = r.data?.data;
        const arr = Array.isArray(raw) ? raw : (raw?.data ?? []);
        setRoles(arr);
      })
      .catch(() => setRoles([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!discountId) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const [roleId, value] of Object.entries(discounts)) {
        payload[`role_${roleId}_discount`] =
          value === "" ? null : parseFloat(value);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await discountService.update(discountId, payload as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="">
      <div className="flex items-start justify-between mb-4 p-5">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Pricing
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Override the base discount for users of a specific role.
          </p>
        </div>
        {discountId && (
          <Button
            size="sm"
            variant={saved ? "secondary" : "primary"}
            disabled={saving}
            loading={saving}
            onClick={handleSave}
          >
            {saved ? "Saved" : "Save roles"}
          </Button>
        )}
      </div>

      {!discountId ? (
        <p className="p-5 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
          Save the discount record first to configure role-based overrides.
        </p>
      ) : loading ? (
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
          No roles found.
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
                  value={discounts[String(role.id)] ?? ""}
                  onChange={(v) =>
                    setDiscounts((d) => ({ ...d, [String(role.id)]: v }))
                  }
                  placeholder="0"
                  suffix="%"
                />
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
  const [vendors, setVendors] = useState<Provider[]>([]);
  const [saving, setSaving] = useState(false);
  const [roleInitialValues, setRoleInitialValues] = useState<
    Record<string, string>
  >(stateDiscount ? extractRoleDiscounts(stateDiscount) : {});

  useEffect(() => {
    networkService
      .getAll()
      .then(setNetworks)
      .catch(() => {});
    providerService
      .getAll()
      .then(setVendors)
      .catch(() => {});
    // console.log(vendors)
  }, []);

  useEffect(() => {
    if (id && !stateDiscount) {
      discountService
        .getById(id)
        .then((d) => {
          setInitial(d);
          setForm(toForm(d));
          setRoleInitialValues(extractRoleDiscounts(d));
        })
        .finally(() => setFetchingInitial(false));
    }
  }, [id, stateDiscount]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addVendor = (code: string) =>
    setForm((f) => ({
      ...f,
      vendorDiscounts: { ...f.vendorDiscounts, [code]: "" },
    }));

  const removeVendor = (code: string) =>
    setForm((f) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [code]: _, ...rest } = f.vendorDiscounts;
      return { ...f, vendorDiscounts: rest };
    });

  const setVendorDiscount = (code: string, value: string) =>
    setForm((f) => ({
      ...f,
      vendorDiscounts: { ...f.vendorDiscounts, [code]: value },
    }));

  const valid = String(form.name).trim().length > 0;

  const handleSubmit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = toPayload(form) as any;
      if (initial) {
        await discountService.update(String(initial.id), payload);
      } else {
        await discountService.create(payload);
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
            <ProviderPicker
              vendors={vendors}
              selected={Object.keys(form.vendorDiscounts)}
              discounts={form.vendorDiscounts}
              onAdd={addVendor}
              onRemove={removeVendor}
              onDiscountChange={setVendorDiscount}
            />
          </Card>
          <RoleDiscountsSection
            discountId={initial ? String(initial.id) : undefined}
            initialValues={roleInitialValues}
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
                value={Boolean(form.isActive)}
                onChange={(v) => set("isActive", v)}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* ── Role discounts — separate section, own save action ── */}
    </div>
  );
}
