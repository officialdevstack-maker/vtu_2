import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowLeft, CheckCircle2, RefreshCw, Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  PageHeader,
  StatusBadge,
  inputCls,
} from "../../../user/components/shared-ui";
import { providerService, type ImportedProviderPlan } from "./providerService";

const money = (value: number | null) =>
  value == null
    ? "—"
    : `₦${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const apiError = (error: unknown, fallback: string) =>
  axios.isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ??
      fallback)
    : fallback;

export default function ProviderPlanImportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [providerName, setProviderName] = useState("Provider");
  const [plans, setPlans] = useState<ImportedProviderPlan[]>([]);
  const [costs, setCosts] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [markup, setMarkup] = useState("5");
  const [activate, setActivate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await providerService.getPlanImports(id);
      setProviderName(response.provider.name);
      setPlans(response.plans);
      setCosts(
        Object.fromEntries(
          response.plans.map((plan) => [
            plan.id,
            plan.cost_price == null ? "" : String(plan.cost_price),
          ]),
        ),
      );
    } catch (error) {
      setMessage({
        ok: false,
        text: apiError(error, "Could not load imported plans."),
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const validCostIds = useMemo(
    () =>
      plans.filter((plan) => Number(costs[plan.id]) > 0).map((plan) => plan.id),
    [costs, plans],
  );

  const setCost = (planId: number, value: string) => {
    setCosts((current) => ({ ...current, [planId]: value }));
    setSelected((current) => {
      const next = new Set(current);
      if (Number(value) > 0) next.add(planId);
      else next.delete(planId);
      return next;
    });
  };

  const toggle = (planId: number) =>
    setSelected((current) => {
      const next = new Set(current);
      next.has(planId) ? next.delete(planId) : next.add(planId);
      return next;
    });

  const handleSync = async () => {
    if (!id) return;
    setSyncing(true);
    setMessage(null);
    try {
      const summary = await providerService.syncPlans(id);
      await load();
      setMessage({
        ok: true,
        text: `${summary.created} new and ${summary.updated} updated. ${summary.pending_pricing ?? 0} plan(s) need a cost price.`,
      });
    } catch (error) {
      setMessage({
        ok: false,
        text: apiError(error, "Could not fetch plans from QuicklySIM."),
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async () => {
    if (!id || selected.size === 0) return;
    const markupNumber = Number(markup);
    if (!Number.isFinite(markupNumber) || markupNumber < 0) {
      setMessage({ ok: false, text: "Enter a valid markup percentage." });
      return;
    }

    const rows = [...selected].map((planId) => ({
      plan_id: planId,
      cost_price: Number(costs[planId]),
    }));
    if (
      rows.some(
        (row) => !Number.isFinite(row.cost_price) || row.cost_price <= 0,
      )
    ) {
      setMessage({
        ok: false,
        text: "Every selected plan needs a provider cost greater than zero.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const result = await providerService.importPlanPrices(id, {
        markup_percent: markupNumber,
        activate,
        plans: rows,
      });
      setSelected(new Set());
      await load();
      setMessage({
        ok: true,
        text: `${result.updated} plan(s) priced${activate ? " and activated" : ""} successfully.`,
      });
    } catch (error) {
      setMessage({
        ok: false,
        text: apiError(error, "Could not import provider prices."),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="QuicklySIM plan pricing"
        description={`Fetch plans for ${providerName}, enter provider costs, and apply one markup in bulk.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/admin/apis/provider/${id}`)}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={syncing}
              disabled={syncing}
              onClick={() => void handleSync()}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
              />{" "}
              Fetch plans
            </Button>
          </div>
        }
      />

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-[220px_1fr_auto] md:items-end">
          <label className="space-y-1.5 text-sm font-medium text-slate-700">
            Markup percentage
            <div className="relative">
              <input
                className={`${inputCls} pr-8`}
                type="number"
                min="0"
                step="0.01"
                value={markup}
                onChange={(event) => setMarkup(event.target.value)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                %
              </span>
            </div>
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={activate}
              onChange={(event) => setActivate(event.target.checked)}
            />
            Activate selected plans after pricing
          </label>
          <Button
            disabled={saving || selected.size === 0}
            loading={saving}
            onClick={() => void handleImport()}
          >
            <Upload className="h-4 w-4" /> Import {selected.size || ""} price
            {selected.size === 1 ? "" : "s"}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all plans with a valid cost"
                    checked={
                      validCostIds.length > 0 &&
                      validCostIds.every((planId) => selected.has(planId))
                    }
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? new Set(validCostIds)
                          : new Set(),
                      )
                    }
                  />
                </th>
                <th className="px-4 py-3">Network / type</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Validity</th>
                <th className="px-4 py-3">External ID</th>
                <th className="px-4 py-3">Provider cost</th>
                <th className="px-4 py-3">Selling price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-slate-500"
                    colSpan={8}
                  >
                    Loading imported plans…
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-slate-500"
                    colSpan={8}
                  >
                    No plans fetched yet. Select “Fetch plans” to import the
                    QuicklySIM catalogue.
                  </td>
                </tr>
              ) : (
                plans.map((plan) => {
                  const cost = Number(costs[plan.id]);
                  const selling =
                    cost > 0 && Number(markup) >= 0
                      ? cost * (1 + Number(markup) / 100)
                      : null;
                  return (
                    <tr key={plan.id} className="text-slate-700">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(plan.id)}
                          onChange={() => toggle(plan.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold uppercase">
                          {plan.network}
                        </div>
                        <div className="text-xs text-slate-400">
                          {plan.plan_type}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {plan.plan_name} {plan.plan_size}
                      </td>
                      <td className="px-4 py-3">{plan.validity || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {plan.external_plan_id}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className={`${inputCls} w-32`}
                          aria-label={`Cost for ${plan.plan_name}${plan.plan_size}`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0.00"
                          value={costs[plan.id] ?? ""}
                          onChange={(event) =>
                            setCost(plan.id, event.target.value)
                          }
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {money(selling)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={plan.active ? "active" : "inactive"}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Selling
          price = provider cost + configured markup. Unpriced plans always
          remain inactive.
        </div>
      </Card>
    </div>
  );
}
