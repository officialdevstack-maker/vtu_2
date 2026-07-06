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
  selectCls,
} from "../../../user/components/shared-ui";
import {
  eventService,
  type EventRecord,
  type EventMetric,
  type EventRewardType,
  type EventPayload,
} from "./service";

const BACK = "/admin/growth/events";

type FormState = {
  name: string;
  description: string;
  metric: EventMetric;
  service_type: string;
  threshold: string;
  repeatable: boolean;
  reward_type: EventRewardType;
  badge_name: string;
  badge_icon: string;
  cash_amount: string;
  active: boolean;
};

type FormErrors = Partial<Record<"name" | "threshold" | "badge_name" | "cash_amount", string>>;

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

const blankForm = (): FormState => ({
  name: "",
  description: "",
  metric: "referral_count",
  service_type: "",
  threshold: "",
  repeatable: false,
  reward_type: "badge",
  badge_name: "",
  badge_icon: "",
  cash_amount: "",
  active: true,
});

function toForm(event: EventRecord): FormState {
  return {
    name: event.name,
    description: event.description ?? "",
    metric: event.metric,
    service_type: event.service_type ?? "",
    threshold: String(event.threshold ?? ""),
    repeatable: event.repeatable,
    reward_type: event.reward_type,
    badge_name: event.badge_name ?? "",
    badge_icon: event.badge_icon ?? "",
    cash_amount: event.cash_amount != null ? String(event.cash_amount) : "",
    active: event.active,
  };
}

function toPayload(form: FormState): EventPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    metric: form.metric,
    service_type: form.service_type.trim() || null,
    threshold: Number(form.threshold),
    repeatable: form.repeatable,
    reward_type: form.reward_type,
    badge_name:
      form.reward_type === "badge" || form.reward_type === "both" ? form.badge_name.trim() : null,
    badge_icon: form.badge_icon.trim() || null,
    cash_amount:
      form.reward_type === "cash" || form.reward_type === "both"
        ? Number(form.cash_amount || 0)
        : null,
    active: form.active,
  };
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Name is required.";
  if (form.threshold === "" || Number.isNaN(Number(form.threshold)) || Number(form.threshold) <= 0) {
    errors.threshold = "Enter a positive number.";
  }
  if ((form.reward_type === "badge" || form.reward_type === "both") && !form.badge_name.trim()) {
    errors.badge_name = "Badge name is required for a badge reward.";
  }
  if (
    (form.reward_type === "cash" || form.reward_type === "both") &&
    (form.cash_amount === "" || Number.isNaN(Number(form.cash_amount)) || Number(form.cash_amount) < 0)
  ) {
    errors.cash_amount = "Enter a valid non-negative cash amount.";
  }
  return errors;
}

const usesServiceType = (metric: EventMetric) =>
  metric === "transaction_volume" || metric === "transaction_count";

export default function EventFormPage() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const stateEvent = (location.state as { event?: EventRecord } | null)?.event;

  const [initial, setInitial] = useState<EventRecord | undefined>(stateEvent);
  const [fetchingInitial, setFetchingInitial] = useState(id != null && !stateEvent);
  const [form, setForm] = useState<FormState>(stateEvent ? toForm(stateEvent) : blankForm());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (id && !stateEvent) {
      eventService
        .getById(id)
        .then((e) => {
          setInitial(e);
          setForm(toForm(e));
        })
        .finally(() => setFetchingInitial(false));
    }
  }, [id, stateEvent]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k as keyof FormErrors] ? { ...e, [k]: undefined } : e));
  };

  const valid = form.name.trim().length > 0 && form.threshold.trim().length > 0;

  const handleSubmit = async () => {
    const formErrors = validateForm(form);
    setErrors(formErrors);
    setSubmitError(null);
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = toPayload(form);
      if (initial) {
        await eventService.update(initial.id, payload);
      } else {
        await eventService.create(payload);
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
        <Card className="p-5 space-y-4 max-w-2xl">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-full bg-slate-100 rounded animate-pulse" />
          ))}
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
              onClick={() => navigate(BACK)}
              className="p-1 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {initial ? "Edit event" : "New event"}
          </div>
        }
        description={
          initial
            ? `Editing "${initial.name}"`
            : "Define a condition a user must fulfil to earn a badge, cash, or both."
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate(BACK)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!valid || saving} loading={saving} onClick={handleSubmit}>
              {initial ? "Save changes" : "Create event"}
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
              <Field label="Name" error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Refer 5 friends"
                  className={inputCls}
                />
              </Field>

              <Field label="Description" hint="optional">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Shown to admins managing this event"
                  rows={2}
                  className={inputCls}
                />
              </Field>

              <Field label="Active">
                <Toggle value={form.active} onChange={(v) => set("active", v)} />
              </Field>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Condition</SectionTitle>
            <div className="space-y-4">
              <Field label="Metric">
                <select
                  value={form.metric}
                  onChange={(e) => set("metric", e.target.value as EventMetric)}
                  className={selectCls}
                >
                  <option value="referral_count">Number of referrals</option>
                  <option value="transaction_volume">Total spend (₦)</option>
                  <option value="transaction_count">Number of purchases</option>
                  <option value="wallet_funding_total">Total wallet funding (₦)</option>
                </select>
              </Field>

              {usesServiceType(form.metric) && (
                <Field label="Service type" hint="optional — leave blank for all services">
                  <input
                    value={form.service_type}
                    onChange={(e) => set("service_type", e.target.value)}
                    placeholder="e.g. airtime_recharge"
                    className={inputCls}
                  />
                </Field>
              )}

              <Field label="Threshold" error={errors.threshold}>
                <input
                  type="number"
                  min={0}
                  value={form.threshold}
                  onChange={(e) => set("threshold", e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </Field>

              <Field label="Repeats" hint="how often the reward re-triggers">
                <select
                  value={form.repeatable ? "yes" : "no"}
                  onChange={(e) => set("repeatable", e.target.value === "yes")}
                  className={selectCls}
                >
                  <option value="no">Once — first time the threshold is met</option>
                  <option value="yes">Every time — re-awards every additional threshold reached</option>
                </select>
              </Field>
            </div>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle>Reward</SectionTitle>
            <div className="space-y-4">
              <Field label="Reward type">
                <select
                  value={form.reward_type}
                  onChange={(e) => set("reward_type", e.target.value as EventRewardType)}
                  className={selectCls}
                >
                  <option value="badge">Badge only</option>
                  <option value="cash">Cash only</option>
                  <option value="both">Badge + cash</option>
                </select>
              </Field>

              {(form.reward_type === "badge" || form.reward_type === "both") && (
                <>
                  <Field label="Badge name" error={errors.badge_name}>
                    <input
                      value={form.badge_name}
                      onChange={(e) => set("badge_name", e.target.value)}
                      placeholder="e.g. Referral Champion"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Badge icon" hint="optional — an emoji, e.g. 🏆">
                    <input
                      value={form.badge_icon}
                      onChange={(e) => set("badge_icon", e.target.value)}
                      placeholder="🏆"
                      className={inputCls}
                    />
                  </Field>
                </>
              )}

              {(form.reward_type === "cash" || form.reward_type === "both") && (
                <Field label="Cash amount" error={errors.cash_amount}>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={form.cash_amount}
                      onChange={(e) => set("cash_amount", e.target.value)}
                      placeholder="0"
                      className={`${inputCls} pr-10`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                      ₦
                    </span>
                  </div>
                </Field>
              )}

              <p className="text-xs text-slate-400">
                Cash is credited straight to the wallet the moment the condition is met — badges are
                cosmetic and shown on the user's profile.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
