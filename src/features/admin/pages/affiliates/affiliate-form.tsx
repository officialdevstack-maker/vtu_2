import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, AlertCircle } from "lucide-react";
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
  childInstanceService,
  type ChildInstance,
  type ChildInstancePayload,
} from "./service";

const BACK = "/admin/affiliates";

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

type FormState = ChildInstancePayload;

const toForm = (i: ChildInstance): FormState => ({
  name: i.name ?? "",
  base_url: i.base_url ?? "",
  status: i.status,
});

const affiliateFormSchema = z.object({
  name: z.string().trim().min(1, { message: "Affiliate name is required." }),
});

type FormErrors = Partial<Record<"name", string>>;

function validateForm(form: FormState): FormErrors {
  const result = affiliateFormSchema.safeParse(form);
  if (result.success) return {};

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof FormErrors | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
// Edit-only — new affiliates are created via the "Generate code" modal on
// the list page (childInstanceService.generateCode), not a full form. This
// page only ever handles /admin/affiliates/:id/edit.

export default function AffiliateFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const stateInstance = (location.state as { instance?: ChildInstance } | null)?.instance;

  const [initial, setInitial] = useState<ChildInstance | undefined>(stateInstance);
  const [fetchingInitial, setFetchingInitial] = useState(!stateInstance);
  const [form, setForm] = useState<FormState>(
    stateInstance ? toForm(stateInstance) : { name: "", base_url: "", status: "pending" },
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (id && !stateInstance) {
      childInstanceService
        .getById(id)
        .then((i) => {
          setInitial(i);
          setForm(toForm(i));
        })
        .finally(() => setFetchingInitial(false));
    }
  }, [id, stateInstance]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as keyof FormErrors] ? { ...e, [k]: undefined } : e));
  };

  const valid = form.name.trim().length > 0;

  const handleSubmit = async () => {
    if (!id) return;
    const formErrors = validateForm(form);
    setErrors(formErrors);
    setSubmitError(null);
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      await childInstanceService.update(id, form);
      navigate(`${BACK}/${id}`);
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
        <Card className="p-5 space-y-4 max-w-xl">
          {[...Array(3)].map((_, i) => (
            <SkeletonLine key={i} className="h-8 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  if (!initial) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Affiliate"
          actions={
            <Button variant="secondary" size="sm" onClick={() => navigate(BACK)}>
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
          }
        />
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500">Affiliate not found.</p>
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
              onClick={() => navigate(`${BACK}/${id}`)}
              className="p-1 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            Edit affiliate
          </div>
        }
        description={`Editing "${initial.name}"`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate(`${BACK}/${id}`)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!valid || saving} loading={saving} onClick={handleSubmit}>
              Save changes
            </Button>
          </>
        }
      />

      {submitError && <ErrorBanner message={submitError} />}

      <Card className="p-5 max-w-xl">
        <SectionTitle>General</SectionTitle>
        <div className="space-y-4">
          <Field label="Affiliate name" error={errors.name}>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Adex Maditel"
              className={inputCls}
            />
          </Field>

          <Field label="Base URL" hint="optional, for reference">
            <input
              value={form.base_url ?? ""}
              onChange={(e) => set("base_url", e.target.value)}
              placeholder="https://app.maditelecoms.com"
              className={`${inputCls} font-mono`}
              autoComplete="off"
            />
          </Field>

          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as FormState["status"])}
              className={selectCls}
            >
              {initial.status === "pending" && <option value="pending">Pending (not yet connected)</option>}
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="revoked">Revoked</option>
            </select>
          </Field>
        </div>
      </Card>
    </div>
  );
}
