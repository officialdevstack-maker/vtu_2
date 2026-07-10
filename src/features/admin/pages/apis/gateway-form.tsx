import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff, Power } from "lucide-react";
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
import { SectionTitle, Field, ErrorBanner, extractErrorMessage } from "../settings/shared";
import {
  gatewayService,
  type Gateway,
  type GatewayPayload,
  type GatewayType,
} from "./gatewayService";

const BACK = "/admin/apis/gateway";

// Credential columns a gateway can hold; the visible set is driven by the
// selected engine's schema (PaymentFactory::availableGateways on the backend).
const CREDENTIAL_KEYS = [
  "username",
  "password",
  "api_key",
  "public_key",
  "secret_key",
  "encryption_key",
  "webhook_access",
] as const;

type FeeType = "fiat" | "percent";

type FormState = {
  name: string;
  code: string;
  username: string;
  password: string;
  api_key: string;
  public_key: string;
  secret_key: string;
  encryption_key: string;
  webhook_access: string;
  charge_fee: string;
  charge_type: FeeType;
  withdrawal_fee: string;
  withdrawal_fee_type: FeeType;
  connection: boolean;
};

const asFeeType = (v: string | null | undefined): FeeType =>
  v === "percent" ? "percent" : "fiat";

const blankForm = (): FormState => ({
  name: "",
  code: "",
  username: "",
  password: "",
  api_key: "",
  public_key: "",
  secret_key: "",
  encryption_key: "",
  webhook_access: "",
  charge_fee: "",
  charge_type: "fiat",
  withdrawal_fee: "",
  withdrawal_fee_type: "fiat",
  connection: false,
});

const toForm = (g: Gateway): FormState => ({
  name: g.name ?? "",
  code: g.code ?? "",
  username: g.username ?? "",
  password: g.password ?? "",
  api_key: g.api_key ?? "",
  public_key: g.public_key ?? "",
  secret_key: g.secret_key ?? "",
  encryption_key: g.encryption_key ?? "",
  webhook_access: g.webhook_access ?? "",
  charge_fee: g.charge_fee != null ? String(g.charge_fee) : "",
  charge_type: asFeeType(g.charge_type),
  withdrawal_fee: g.withdrawal_fee != null ? String(g.withdrawal_fee) : "",
  withdrawal_fee_type: asFeeType(g.withdrawal_fee_type),
  connection: g.connection ?? false,
});

const gatewayFormSchema = z.object({
  name: z.string().trim().min(1, "Gateway name is required."),
});

type FormErrors = Partial<Record<"name", string>>;

function validateForm(form: FormState): FormErrors {
  const result = gatewayFormSchema.safeParse(form);
  if (result.success) return {};
  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof FormErrors | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pr-10 font-mono`}
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function GatewayFormPage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const stateGateway = (location.state as { gateway?: Gateway } | null)?.gateway;
  const isEdit = id != null;

  const [initial, setInitial] = useState<Gateway | undefined>(stateGateway);
  const [fetchingInitial, setFetchingInitial] = useState(isEdit && !stateGateway);
  const [form, setForm] = useState<FormState>(
    stateGateway ? toForm(stateGateway) : blankForm(),
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [types, setTypes] = useState<GatewayType[]>([]);

  useEffect(() => {
    gatewayService.getTypes().then(setTypes).catch(() => {});
  }, []);

  useEffect(() => {
    if (id && !stateGateway) {
      gatewayService
        .getById(id)
        .then((g) => {
          setInitial(g);
          setForm(toForm(g));
        })
        .finally(() => setFetchingInitial(false));
    }
  }, [id, stateGateway]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as keyof FormErrors] ? { ...e, [k]: undefined } : e));
  };

  const cancelTo = isEdit && id ? `${BACK}/${id}` : BACK;

  const selectedGateway = types.find(
    (t) => t.value.toLowerCase() === form.name.trim().toLowerCase(),
  );
  const credentialFields = selectedGateway?.credentials ?? [];
  const nameIsKnown =
    !form.name || types.some((t) => t.value.toLowerCase() === form.name.trim().toLowerCase());

  const handleSubmit = async () => {
    const formErrors = validateForm(form);
    setErrors(formErrors);
    setSubmitError(null);
    if (Object.keys(formErrors).length > 0) return;

    const activeCreds = new Set(credentialFields.map((f) => f.key));
    const credOrNull = (key: (typeof CREDENTIAL_KEYS)[number]) =>
      activeCreds.has(key) ? form[key] || null : null;
    const payload: GatewayPayload = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      connection: form.connection,
      // Only persist the credentials this gateway uses; clear the rest so
      // switching engine never leaves a stale secret behind.
      username: credOrNull("username"),
      password: credOrNull("password"),
      api_key: credOrNull("api_key"),
      public_key: credOrNull("public_key"),
      secret_key: credOrNull("secret_key"),
      encryption_key: credOrNull("encryption_key"),
      webhook_access: credOrNull("webhook_access"),
      // Fees: deposit = charge_fee/charge_type, withdrawal = its own pair.
      charge_fee: form.charge_fee === "" ? 0 : Number(form.charge_fee),
      charge_type: form.charge_type,
      withdrawal_fee: form.withdrawal_fee === "" ? 0 : Number(form.withdrawal_fee),
      withdrawal_fee_type: form.withdrawal_fee_type,
    };

    setSaving(true);
    try {
      if (isEdit && id) {
        await gatewayService.update(id, payload);
        navigate(`${BACK}/${id}`);
      } else {
        const created = await gatewayService.create(payload);
        navigate(created?.id != null ? `${BACK}/${created.id}` : BACK);
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
          <Card className="p-5 space-y-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonLine key={i} className="h-8 w-full" />
            ))}
          </Card>
          <Card className="p-5 space-y-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonLine key={i} className="h-8 w-full" />
            ))}
          </Card>
        </div>
      </div>
    );
  }

  if (isEdit && !fetchingInitial && !initial) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Edit gateway"
          actions={
            <Button variant="secondary" size="sm" onClick={() => navigate(BACK)}>
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
          }
        />
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500 mb-3">Gateway not found.</p>
          <Button variant="secondary" size="sm" onClick={() => navigate(BACK)}>
            Go back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(cancelTo)}
              className="p-1 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {isEdit ? "Edit gateway" : "Add gateway"}
          </div>
        }
        description={
          isEdit
            ? `Editing "${initial?.name}"`
            : "Configure a payment provider used for wallet funding and vendor auto-funding."
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate(cancelTo)}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving} loading={saving} onClick={handleSubmit}>
              {isEdit ? "Save changes" : "Add gateway"}
            </Button>
          </>
        }
      />

      {submitError && <ErrorBanner message={submitError} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Left: general ── */}
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle>General</SectionTitle>
            <div className="space-y-4">
              <Field label="Gateway" error={errors.name} hint="which payment engine">
                <select
                  value={selectedGateway?.value ?? (nameIsKnown ? "" : form.name)}
                  onChange={(e) => set("name", e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select…</option>
                  {types.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                  {!nameIsKnown && form.name && (
                    <option value={form.name}>{form.name} (unknown)</option>
                  )}
                </select>
              </Field>

              <Field label="Code" hint="optional">
                <input
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  placeholder="e.g. FLW"
                  maxLength={10}
                  className={`${inputCls} font-mono uppercase`}
                />
              </Field>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <Power className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium text-slate-700">Connection</p>
                    <p className="text-xs text-slate-400">
                      Only connected gateways are offered for funding.
                    </p>
                  </div>
                </div>
                <Toggle value={form.connection} onChange={(v) => set("connection", v)} />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Fees</SectionTitle>
            <p className="text-xs text-slate-400 -mt-2 mb-4">
              Deposit fee is deducted from each wallet funding; withdrawal fee is
              added on top of a payout. Percent is of the amount.
            </p>
            <div className="space-y-4">
              <Field label="Deposit fee">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.charge_fee}
                    onChange={(e) => set("charge_fee", e.target.value)}
                    placeholder="0"
                    className={`${inputCls} flex-1`}
                  />
                  <select
                    value={form.charge_type}
                    onChange={(e) => set("charge_type", e.target.value as FeeType)}
                    className={`${selectCls} w-32`}
                  >
                    <option value="fiat">Fixed (₦)</option>
                    <option value="percent">Percent (%)</option>
                  </select>
                </div>
              </Field>

              <Field label="Withdrawal fee">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.withdrawal_fee}
                    onChange={(e) => set("withdrawal_fee", e.target.value)}
                    placeholder="0"
                    className={`${inputCls} flex-1`}
                  />
                  <select
                    value={form.withdrawal_fee_type}
                    onChange={(e) =>
                      set("withdrawal_fee_type", e.target.value as FeeType)
                    }
                    className={`${selectCls} w-32`}
                  >
                    <option value="fiat">Fixed (₦)</option>
                    <option value="percent">Percent (%)</option>
                  </select>
                </div>
              </Field>
            </div>
          </Card>
        </div>

        {/* ── Right: credentials ── */}
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle>API credentials</SectionTitle>
            {!selectedGateway ? (
              <p className="text-xs text-slate-400">
                Select a gateway to configure its credentials.
              </p>
            ) : (
              <div className="space-y-4">
                {credentialFields.map((f) => {
                  const key = f.key as (typeof CREDENTIAL_KEYS)[number];
                  const value = (form[key] as string) ?? "";
                  return (
                    <Field key={f.key} label={f.label}>
                      {f.secret ? (
                        <SecretInput value={value} onChange={(v) => set(key, v)} />
                      ) : (
                        <input
                          value={value}
                          onChange={(e) => set(key, e.target.value)}
                          className={`${inputCls} font-mono`}
                          autoComplete="off"
                        />
                      )}
                    </Field>
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
