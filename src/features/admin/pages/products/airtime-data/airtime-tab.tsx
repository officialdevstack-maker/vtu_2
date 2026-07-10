import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  PhoneCall,
  SlidersHorizontal,
  MoreVertical,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import {
  Card,
  Button,
  EmptyState,
  SkeletonLine,
  StatusBadge,
} from "../../../../user/components/shared-ui";
import { Toolbar, SelectFilter } from "./shared";
import { airtimePlanService, type AirtimePlan } from "./service";

const formatCurrency = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(value);
};

const MENU_WIDTH = 144; // w-36

export function AirtimeTab() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<AirtimePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkFilter, setNetworkFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // The table scrolls horizontally (overflow-x-auto), which forces
  // overflow-y to auto too per the CSS spec — an `absolute` dropdown would
  // get clipped by that. Fixed-positioning it from the trigger's own
  // bounding rect escapes the table's overflow context entirely.
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toId = (value: string | number) => String(value);

  const toggleMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.right - MENU_WIDTH });
    setOpenMenuId(id);
  };

  const handleDelete = async (plan: AirtimePlan) => {
    setDeletingId(toId(plan.id));
    setOpenMenuId(null);
    try {
      await airtimePlanService.remove(toId(plan.id));
      setPlans((prev) =>
        prev.filter((p) => toId(p.id) !== toId(plan.id)),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (plan: AirtimePlan) => {
    const id = toId(plan.id);
    setTogglingId(id);
    setOpenMenuId(null);
    try {
      const updated = await airtimePlanService.toggleStatus(plan);
      setPlans((prev) => prev.map((p) => (toId(p.id) === id ? updated : p)));
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    airtimePlanService
      .getAll()
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  const networkOptions = useMemo(
    () =>
      Array.from(
        new Set(plans.map((p) => p.network).filter((n): n is string => Boolean(n))),
      ).map((network) => ({ value: network.toLowerCase(), label: network })),
    [plans],
  );

  const filtered = plans.filter((p) => {
    const q = networkFilter.toLowerCase();
    return !q || p.network?.toLowerCase() === q;
  });

  return (
    <Card className="min-w-0 overflow-hidden">
      <Toolbar>
        <SelectFilter
          placeholder="All networks"
          options={networkOptions}
          value={networkFilter}
          onChange={setNetworkFilter}
        />
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={() => navigate("/admin/products/airtime-data/airtime-plan/new")}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Set airtime plan
        </Button>
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
          icon={PhoneCall}
          title={
            networkFilter
              ? "No airtime plans for this network"
              : "No airtime plans configured"
          }
          description={
            networkFilter
              ? "Try a different network or add a plan for it."
              : "Set an amount range per network to control airtime purchases."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Network|Type", "Min|Max (₦)", "Status", "Actions"].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap ${i === 5 ? "text-left" : i === 0 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((plan) => {
                const isEnabled = Boolean(plan.active ?? false);
                const currentId = toId(plan.id);

                return (
                  <tr
                    key={plan.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">
                      {plan.network}|{plan.category}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">
                      {formatCurrency(plan.min)}|
                      {formatCurrency(plan.max)}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600 text-right">
                      <StatusBadge status={isEnabled ? "active" : "inactive"} />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(currentId, e);
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openMenuId === currentId && menuPos && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div
                              className="fixed z-30 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                              style={{ top: menuPos.top, left: menuPos.left }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/admin/products/airtime-data/airtime-plan/${toId(plan.id)}/edit`,
                                    { state: { plan } },
                                  );
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                disabled={togglingId === currentId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleToggle(plan);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                <Power className="w-3.5 h-3.5" />
                                {isEnabled ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                disabled={deletingId === currentId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDelete(plan);
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
