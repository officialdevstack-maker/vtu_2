import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff, RefreshCw, Wallet } from "lucide-react";
import { z } from "zod";
import {
  PageHeader,
  Card,
  Button,
  inputCls,
  selectCls,
  SkeletonLine,
} from "../../../user/components/shared-ui";
import { SectionTitle, Field, ErrorBanner, extractErrorMessage } from "../settings/shared";
import {
  customerService,
  roleService,
  type Customer,
  type CustomerPayload,
  type Role,
} from "./service";

const BACK = "/admin/customers/users";

type FormState = {
  name: string;
  username: string;
  email: string;
  phone: string;
  roleId: string;
  status: "active" | "suspended" | "inactive";
  password: string;
};

const blankForm = (): FormState => ({
  name: "",
  username: "",
  email: "",
  phone: "",
  roleId: "",
  status: "active",
  password: "",
});

const toForm = (c: Customer): FormState => ({
  name: c.name,
  username: c.username ?? "",
  email: c.email,
  phone: c.phone,
  roleId: c.roleId ?? "",
  status: c.status,
  password: "",
});

const slugifyUsername = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16);

const generatePassword = () =>
  `Vtu${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 90 + 10)}!`;

const baseSchema = z.object({
  name: z.string().trim().min(1, "Full name is required."),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .regex(/^[a-z0-9_.-]+$/i, "Letters, numbers, dots, dashes and underscores only."),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a valid phone number."),
});

type FormErrors = Partial<Record<"name" | "username" | "email" | "phone" | "password", string>>;

function validateForm(form: FormState, isEdit: boolean): FormErrors {
  const errors: FormErrors = {};
  const result = baseSchema.safeParse(form);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof FormErrors | undefined;
      if (key && !errors[key]) errors[key] = issue.message;
    }
  }
  // Password: required on create, optional on edit (blank = unchanged).
  if (!isEdit && form.password.length === 0) {
    errors.password = "Set an initial password for this customer.";
  } else if (form.password.length > 0 && form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}

export default function CustomerFormPage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const stateCustomer = (location.state as { customer?: Customer } | null)?.customer;
  const isEdit = id != null;

  const [initial, setInitial] = useState<Customer | undefined>(stateCustomer);
  const [fetchingInitial, setFetchingInitial] = useState(isEdit && !stateCustomer);
  const [form, setForm] = useState<FormState>(
    stateCustomer ? toForm(stateCustomer) : blankForm(),
  );
  const [usernameEdited, setUsernameEdited] = useState(isEdit);
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    if (id && !stateCustomer) {
      customerService
        .getById(id)
        .then((c) => {
          setInitial(c);
          setForm(toForm(c));
        })
        .finally(() => setFetchingInitial(false));
    }
  }, [id, stateCustomer]);

  useEffect(() => {
    roleService
      .getAll()
      .then((all) => {
        const active = all.filter((r) => r.status === "active");
        setRoles(active);
        // New customers default to the same role self-registration assigns.
        setForm((f) =>
          f.roleId
            ? f
            : {
                ...f,
                roleId:
                  active.find((r) => r.slug.toLowerCase() === "basic")?.id ??
                  active[0]?.id ??
                  "",
              },
        );
      })
      .catch(() => setRoles([]))
      .finally(() => setRolesLoading(false));
  }, []);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as keyof FormErrors] ? { ...e, [k]: undefined } : e));
  };

  const setName = (value: string) => {
    setForm((f) => ({
      ...f,
      name: value,
      // Suggest a username from the name until the admin types their own.
      username: usernameEdited ? f.username : slugifyUsername(value),
    }));
    setErrors((e) => (e.name || e.username ? { ...e, name: undefined, username: undefined } : e));
  };

  const cancelTo = isEdit && id ? `${BACK}/${id}` : BACK;

  const handleSubmit = async () => {
    const formErrors = validateForm(form, isEdit);
    setErrors(formErrors);
    setSubmitError(null);
    if (Object.keys(formErrors).length > 0) return;

    const payload: CustomerPayload = {
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      roleId: form.roleId || undefined,
      ...(isEdit ? { status: form.status } : {}),
      ...(form.password ? { password: form.password } : {}),
    };

    setSaving(true);
    try {
      if (isEdit && id) {
        await customerService.update(id, payload);
        navigate(`${BACK}/${id}`);
      } else {
        const created = await customerService.create(payload);
        navigate(created.id ? `${BACK}/${created.id}` : BACK);
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
            {[...Array(4)].map((_, i) => (
              <SkeletonLine key={i} className="h-8 w-full" />
            ))}
          </Card>
          <Card className="p-5 space-y-4">
            {[...Array(3)].map((_, i) => (
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
          title="Edit customer"
          actions={
            <Button variant="secondary" size="sm" onClick={() => navigate(BACK)}>
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </Button>
          }
        />
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500 mb-3">Customer not found.</p>
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
            {isEdit ? "Edit customer" : "Create customer"}
          </div>
        }
        description={
          isEdit
            ? `Editing "${initial?.username || initial?.name}"`
            : "Register a new customer account on the platform."
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate(cancelTo)}>
              Cancel
            </Button>
            <Button size="sm" disabled={saving} loading={saving} onClick={handleSubmit}>
              {isEdit ? "Save changes" : "Create customer"}
            </Button>
          </>
        }
      />

      {submitError && <ErrorBanner message={submitError} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Left: profile ── */}
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle>Profile</SectionTitle>
            <div className="space-y-4">
              <Field label="Full name" error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chidinma Okafor"
                  className={inputCls}
                />
              </Field>

              <Field
                label="Username"
                hint={isEdit ? undefined : "auto-suggested from the name"}
                error={errors.username}
              >
                <input
                  value={form.username}
                  onChange={(e) => {
                    setUsernameEdited(true);
                    set("username", e.target.value);
                  }}
                  placeholder="e.g. chidinma"
                  className={`${inputCls} font-mono`}
                  autoComplete="off"
                />
              </Field>

              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="name@example.com"
                  className={inputCls}
                  autoComplete="off"
                />
              </Field>

              <Field label="Phone" error={errors.phone}>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="e.g. 08031234567"
                  inputMode="tel"
                  className={inputCls}
                  autoComplete="off"
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* ── Right: access ── */}
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle>Account & access</SectionTitle>
            <div className="space-y-4">
              <Field
                label="Role"
                hint="sets permissions and pricing tier"
              >
                <select
                  value={form.roleId}
                  onChange={(e) => set("roleId", e.target.value)}
                  disabled={rolesLoading}
                  className={selectCls}
                >
                  {rolesLoading && <option value="">Loading roles…</option>}
                  {!rolesLoading && !form.roleId && (
                    <option value="">Select a role…</option>
                  )}
                  {/* Keep an edited customer's current role selectable even
                      when it's inactive and thus filtered from the list. */}
                  {!rolesLoading &&
                    form.roleId &&
                    !roles.some((r) => r.id === form.roleId) && (
                      <option value={form.roleId}>
                        {initial?.roleName ?? "Current role"}
                      </option>
                    )}
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>

              {isEdit && (
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as FormState["status"])}
                    className={selectCls}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>
              )}

              <Field
                label={isEdit ? "Reset password" : "Initial password"}
                hint={isEdit ? "leave blank to keep the current one" : undefined}
                error={errors.password}
              >
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder={isEdit ? "New password" : "Minimum 8 characters"}
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
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      set("password", generatePassword());
                      setShowPw(true);
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Generate
                  </Button>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  {isEdit
                    ? "The customer keeps their existing sessions — share the new password with them directly."
                    : "Share this password with the customer; they can change it after logging in."}
                </p>
              </Field>
            </div>
          </Card>

          {isEdit && (
            <Card className="p-5">
              <div className="flex items-start gap-2.5">
                <Wallet className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500">
                  Wallet balance isn't edited here — use{" "}
                  <span className="font-medium text-slate-700">Fund / debit wallet</span>{" "}
                  on the customer's detail page so every balance change leaves a
                  transaction record.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
