import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Trophy, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  SkeletonLine,
  StatusBadge,
} from "../../../user/components/shared-ui";
import { Toolbar, SelectFilter } from "../products/airtime-data/shared";
import { eventService, type EventRecord, type EventMetric } from "./service";

const METRIC_LABELS: Record<EventMetric, string> = {
  referral_count: "Referrals",
  transaction_volume: "Spend volume",
  transaction_count: "Purchase count",
  wallet_funding_total: "Wallet funding",
};

const formatThreshold = (event: EventRecord) => {
  const n = Number(event.threshold);
  const unit =
    event.metric === "transaction_volume" || event.metric === "wallet_funding_total"
      ? `₦${n.toLocaleString()}`
      : n.toLocaleString();
  return `${METRIC_LABELS[event.metric]} ≥ ${unit}${event.service_type ? ` (${event.service_type})` : ""}`;
};

const formatReward = (event: EventRecord) => {
  const parts: string[] = [];
  if (event.reward_type === "badge" || event.reward_type === "both") {
    parts.push(`🏅 ${event.badge_name ?? "Badge"}`);
  }
  if (event.reward_type === "cash" || event.reward_type === "both") {
    parts.push(`₦${Number(event.cash_amount ?? 0).toLocaleString()}`);
  }
  return parts.join(" + ");
};

export default function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricFilter, setMetricFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    eventService
      .getAll()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (event: EventRecord) => {
    setDeletingId(event.id);
    setOpenMenuId(null);
    try {
      await eventService.remove(event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (event: EventRecord) => {
    const updated = await eventService.toggleStatus(event);
    setEvents((prev) => prev.map((e) => (e.id === event.id ? updated : e)));
  };

  const metricOptions = useMemo(
    () => Array.from(new Set(events.map((e) => e.metric))).map((m) => ({ value: m, label: METRIC_LABELS[m] })),
    [events],
  );

  const filtered = events.filter((e) => !metricFilter || e.metric === metricFilter);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Events"
        description="Admin-defined conditions a user must fulfil to earn a badge, cash, or both — distinct from Discount (automatic price-slash) and Promo Codes (opt-in)."
        actions={
          <Button size="sm" onClick={() => navigate("/admin/growth/events/new")}>
            <Plus className="w-3.5 h-3.5" /> New event
          </Button>
        }
      />

      <Card className="overflow-visible">
        <Toolbar>
          <SelectFilter
            placeholder="All metrics"
            options={metricOptions}
            value={metricFilter}
            onChange={setMetricFilter}
          />
        </Toolbar>

        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonLine className="h-7 w-7 rounded-full" />
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-3 w-16" />
                <SkeletonLine className="h-3 flex-1" />
                <SkeletonLine className="h-5 w-14 rounded-md" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title={metricFilter ? "No events for this metric" : "No events yet"}
            description={
              metricFilter
                ? "Try a different metric filter."
                : "Define a condition — like referring 5 friends — that earns a reward."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Name", "Condition", "Reward", "Repeats", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">{event.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {formatThreshold(event)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {formatReward(event)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {event.repeatable ? "Every time" : "Once"}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleActive(event)}>
                        <StatusBadge status={event.active ? "active" : "inactive"} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === event.id ? null : event.id);
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openMenuId === event.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/growth/events/${event.id}/edit`, {
                                    state: { event },
                                  });
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                disabled={deletingId === event.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDelete(event);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
