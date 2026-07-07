import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, AlertCircle, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { z } from "zod";
import {
  PageHeader,
  Card,
  Button,
  inputCls,
  selectCls,
  SkeletonLine,
} from "../../../user/components/shared-ui";
import {
  providerService,
  type Provider,
  type ProviderPayload,
} from "./providerService";

const BACK = "/admin/apis/provider";

// Matches the DB's `providers.sub_category` enum — "misc" and "payment"
// exist in the enum too, but this form only ever creates/edits VTU vending
// providers (category="vendor"), never payment gateways or the catch-all
// bucket, so those two aren't offered here.
const SUB_CATEGORIES = ["adex", "spurs", "msorg", "simhost"] as const;

// "simhost" is a grouping bucket, not a single engine — the specific vendor
// (SME Plug, Ogdams, vtpass…) is picked by NAME within it, so there's no one
// base URL a "simhost" sub_category implies the way there is for adex/spurs/
// msorg. Per product decision, it's not editable through this
// form for that sub_category at all.
const isEngineType = (subCategory: string) => subCategory !== "simhost";

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

// ─── Form helpers ─────────────────────────────────────────────────────────────

type FormState = ProviderPayload;

const blankForm = (): FormState => ({
  name: "",
  code: "",
  base_url: "",
  username: "",
  password: "",
  sub_category: "",
});

const toForm = (p: Provider): FormState => ({
  name: p.name ?? "",
  code: p.code ?? "",
  base_url: p.base_url ?? "",
  username: p.username ?? "",
  password: p.password ?? "",
  sub_category: p.sub_category ?? "",
});

const providerFormSchema = z.object({
  name: z.string().trim().min(1, { message: "Provider name is required." }),
});

type FormErrors = Partial<Record<"name", string>>;

function validateForm(form: FormState): FormErrors {
  const result = providerFormSchema.safeParse(form);
  if (result.success) return {};

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof FormErrors | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProviderFormPage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const stateProvider = (location.state as { provider?: Provider } | null)?.provider;

  const [initial, setInitial] = useState<Provider | undefined>(stateProvider);
  const [fetchingInitial, setFetchingInitial] = useState(id != null && !stateProvider);
  const [form, setForm] = useState<FormState>(
    stateProvider ? toForm(stateProvider) : blankForm(),
  );
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (id && !stateProvider) {
      providerService
        .getById(id)
        .then((p) => {
          setInitial(p);
          setForm(toForm(p));
        })
        .finally(() => setFetchingInitial(false));
    }
  }, [id, stateProvider]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as keyof FormErrors] ? { ...e, [k]: undefined } : e));
  };

  const showBaseUrl = isEngineType(form.sub_category ?? "");
  const valid = form.name.trim().length > 0;

  const handleSubmit = async () => {
    const formErrors = validateForm(form);
    setErrors(formErrors);
    setSubmitError(null);
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      // A sub_category flip to "simhost" hides the field but shouldn't
      // silently keep stale data from before the switch.
      const payload: ProviderPayload = {
        ...form,
        base_url: showBaseUrl ? form.base_url : null,
      };
      if (initial) {
        await providerService.update(String(initial.id), payload);
        navigate(`${BACK}/${initial.id}`);
      } else {
        const created = await providerService.create(payload);
        navigate(`${BACK}/${created.id}`);
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
              {[...Array(4)].map((_, i) => (
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
              onClick={() => navigate(initial ? `${BACK}/${initial.id}` : BACK)}
              className="p-1 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {initial ? "Edit provider" : "Add provider"}
          </div>
        }
        description={
          initial
            ? `Editing "${initial.name}"`
            : "Configure a new VTU API provider and its credentials."
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(initial ? `${BACK}/${initial.id}` : BACK)}
            >
              Cancel
            </Button>
            <Button size="sm" disabled={!valid || saving} loading={saving} onClick={handleSubmit}>
              {initial ? "Save changes" : "Add provider"}
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
              <Field label="Provider name" error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Adex Server 1"
                  className={inputCls}
                />
              </Field>

              <Field label="Code" hint="optional">
                <input
                  value={form.code ?? ""}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  placeholder="e.g. ADX"
                  maxLength={10}
                  className={`${inputCls} font-mono uppercase`}
                />
              </Field>

              <Field label="Type">
                <select
                  value={form.sub_category ?? ""}
                  onChange={(e) => set("sub_category", e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select…</option>
                  {SUB_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              {showBaseUrl && (
                <Field label="Base URL">
                  <input
                    value={form.base_url ?? ""}
                    onChange={(e) => set("base_url", e.target.value)}
                    placeholder="https://api.example.com"
                    className={`${inputCls} font-mono`}
                    autoComplete="off"
                  />
                </Field>
              )}
            </div>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle>Credentials</SectionTitle>
            <div className="space-y-4">
              <Field label="API username">
                <input
                  value={form.username ?? ""}
                  onChange={(e) => set("username", e.target.value)}
                  className={inputCls}
                  autoComplete="off"
                />
              </Field>

              <Field label="API password / secret">
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password ?? ""}
                    onChange={(e) => set("password", e.target.value)}
                    className={`${inputCls} pr-10`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
