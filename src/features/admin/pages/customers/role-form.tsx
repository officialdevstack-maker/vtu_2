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
} from "../../../user/components/shared-ui";
import {
  roleService,
  permissionService,
  type Role,
  type Permission,
  type RoleStatus,
} from "./service";

const BACK = "/admin/customers/roles";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  description: string;
  status: RoleStatus;
  permissionIds: string[];
  upgradable: boolean;
  upgradeCost: string;
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

// ─── Form helpers ─────────────────────────────────────────────────────────────

const blankForm = (): FormState => ({
  name: "",
  description: "",
  status: "active",
  permissionIds: [],
  upgradable: false,
  upgradeCost: "",
});

const toForm = (r: Role): FormState => ({
  name: r.name,
  description: r.description,
  status: r.status,
  permissionIds: r.permissions.map((p) => p.id),
  upgradable: r.upgradable,
  upgradeCost: r.upgradeCost != null ? String(r.upgradeCost) : "",
});

const roleFormSchema = z
  .object({
    name: z.string().trim().min(1, { message: "Role name is required." }),
    upgradable: z.boolean(),
    upgradeCost: z.string(),
  })
  .refine((data) => !data.upgradable || data.upgradeCost.trim() !== "", {
    message: "Set an upgrade cost, or turn Upgradable off.",
    path: ["upgradeCost"],
  });

type FormErrors = Partial<Record<"name" | "upgradeCost", string>>;

function validateForm(form: FormState): FormErrors {
  const result = roleFormSchema.safeParse(form);
  if (result.success) return {};

  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof FormErrors | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoleFormPage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const stateRole = (location.state as { role?: Role } | null)?.role;

  const [initial, setInitial] = useState<Role | undefined>(stateRole);
  const [fetchingInitial, setFetchingInitial] = useState(id != null && !stateRole);
  const [form, setForm] = useState<FormState>(stateRole ? toForm(stateRole) : blankForm());
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    permissionService.getAll().then(setPermissions).catch(() => {});
  }, []);

  useEffect(() => {
    if (id && !stateRole) {
      roleService
        .getById(id)
        .then((r) => {
          setInitial(r);
          setForm(toForm(r));
        })
        .finally(() => setFetchingInitial(false));
    }
  }, [id, stateRole]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as keyof FormErrors] ? { ...e, [k]: undefined } : e));
  };

  const togglePermission = (permId: string) => {
    setForm((f) => ({
      ...f,
      permissionIds: f.permissionIds.includes(permId)
        ? f.permissionIds.filter((x) => x !== permId)
        : [...f.permissionIds, permId],
    }));
  };

  const valid = form.name.trim().length > 0;

  const handleSubmit = async () => {
    const formErrors = validateForm(form);
    setErrors(formErrors);
    setSubmitError(null);
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        status: form.status,
        permissionIds: form.permissionIds,
        upgradable: form.upgradable,
        upgradeCost: form.upgradeCost.trim() ? Number(form.upgradeCost) : null,
      };
      if (initial) {
        await roleService.update(initial.id, payload, initial.slug);
      } else {
        await roleService.create(payload);
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
            {initial ? "Edit role" : "Create role"}
          </div>
        }
        description={
          initial
            ? `Editing "${initial.name}"${initial.isSystem ? " — a built-in system role" : ""}`
            : "Define what this role can see and do across the admin console"
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate(BACK)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!valid || saving} loading={saving} onClick={handleSubmit}>
              {initial ? "Save changes" : "Create role"}
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
              <Field label="Role name" error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Fraud Analyst"
                  className={inputCls}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="What this role is responsible for"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Permissions</SectionTitle>
            {permissions.length === 0 ? (
              <p className="text-xs text-slate-400">No permissions configured yet.</p>
            ) : (
              <div className="border border-slate-200/70 rounded-xl divide-y divide-gray-100">
                {permissions.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2.5">
                    <div>
                      <span className="text-sm text-slate-700">{p.name}</span>
                      {p.description && <p className="text-xs text-slate-400">{p.description}</p>}
                    </div>
                    <Toggle
                      value={form.permissionIds.includes(p.id)}
                      onChange={() => togglePermission(p.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle>Settings</SectionTitle>
            <div className="flex items-center justify-between border border-slate-200/70 rounded-xl px-3 py-2.5">
              <span className="text-sm text-slate-700">Active</span>
              <Toggle
                value={form.status === "active"}
                onChange={(v) => set("status", v ? "active" : "inactive")}
              />
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Account upgrade</SectionTitle>
            <div className="space-y-3">
              <div className="flex items-center justify-between border border-slate-200/70 rounded-xl px-3 py-2.5">
                <div>
                  <span className="text-sm text-slate-700">Upgradable</span>
                  <p className="text-xs text-slate-400">
                    Customers can self-upgrade into this role from Upgrade Account
                  </p>
                </div>
                <Toggle value={form.upgradable} onChange={(v) => set("upgradable", v)} />
              </div>
              {form.upgradable && (
                <Field label="Upgrade cost (₦)" error={errors.upgradeCost}>
                  <input
                    type="number"
                    min={0}
                    value={form.upgradeCost}
                    onChange={(e) => set("upgradeCost", e.target.value)}
                    placeholder="e.g. 5000"
                    className={inputCls}
                  />
                </Field>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
