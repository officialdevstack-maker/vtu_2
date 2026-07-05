import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, AlertCircle } from "lucide-react";
import axios from "axios";
import {
  PageHeader,
  Card,
  Button,
  inputCls,
  selectCls,
} from "../../../../user/components/shared-ui";
import { networkService, type NetworkPayload } from "./service";

const BACK = "/admin/products/airtime-data?tab=network";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
      {children}
    </h3>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
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

const blankForm: NetworkPayload = {
  name: "",
  code: "",
  provider: "VTpass",
  status: "active",
};

type FormErrors = Partial<Record<"name" | "code", string>>;

function validateForm(form: NetworkPayload): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Network name is required.";
  if (!form.code.trim()) errors.code = "Code is required.";
  return errors;
}

export default function NetworkFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<NetworkPayload>(blankForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof NetworkPayload>(k: K, v: NetworkPayload[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as keyof FormErrors] ? { ...e, [k]: undefined } : e));
  };

  const valid = form.name.trim().length > 0 && form.code.trim().length > 0;

  const handleSubmit = async () => {
    const formErrors = validateForm(form);
    setErrors(formErrors);
    setSubmitError(null);
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      await networkService.create(form);
      navigate(BACK);
    } catch (err) {
      setSubmitError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

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
            New airtime network
          </div>
        }
        description="Register a new network so it can be used across products, plans, and pricing."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate(BACK)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!valid || saving} loading={saving} onClick={handleSubmit}>
              Create network
            </Button>
          </>
        }
      />

      {submitError && <ErrorBanner message={submitError} />}

      <div className="max-w-md">
        <Card className="p-5">
          <SectionTitle>General</SectionTitle>
          <div className="space-y-4">
            <Field label="Network name" error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. MTN"
                className={inputCls}
              />
            </Field>

            <Field label="Code" error={errors.code}>
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. MTN"
                maxLength={10}
                className={`${inputCls} font-mono uppercase`}
              />
            </Field>

            <Field label="Provider">
              <input
                value={form.provider}
                onChange={(e) => set("provider", e.target.value)}
                placeholder="e.g. VTpass"
                className={inputCls}
              />
            </Field>

            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as NetworkPayload["status"])}
                className={selectCls}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
        </Card>
      </div>
    </div>
  );
}
