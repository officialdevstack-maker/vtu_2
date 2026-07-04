import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Database, Plus, MoreVertical, Pencil, Trash2, Search } from "lucide-react";
import {
  Card,
  Button,
  EmptyState,
  SkeletonLine,
  StatusBadge,
  inputCls,
} from "../../../../user/components/shared-ui";
import { Toolbar, SelectFilter } from "./shared";
import { dataPlanService, type DataPlan } from "./service";

const formatCurrency = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(value);
};

export function DataPlansTab() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [networkFilter, setNetworkFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toId = (value: string | number) => String(value);

  const load = () => {
    setLoading(true);
    dataPlanService
      .getAll()
      .then(setPlans)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (plan: DataPlan) => {
    setDeletingId(toId(plan.id));
    setOpenMenuId(null);
    try {
      await dataPlanService.remove(toId(plan.id));
      setPlans((prev) => prev.filter((p) => toId(p.id) !== toId(plan.id)));
    } finally {
      setDeletingId(null);
    }
  };

  const networkOptions = useMemo(
    () =>
      Array.from(new Set(plans.map((p) => p.network).filter(Boolean))).map(
        (network) => ({ value: network.toLowerCase(), label: network }),
      ),
    [plans],
  );

  const typeOptions = useMemo(
    () =>
      Array.from(new Set(plans.map((p) => p.plan_type).filter(Boolean))).map(
        (type) => ({ value: type.toLowerCase(), label: type }),
      ),
    [plans],
  );

  const filtered = plans.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.plan_name?.toLowerCase().includes(q) ||
      p.plan?.toLowerCase().includes(q) ||
      p.network?.toLowerCase().includes(q);
    const matchesNetwork =
      !networkFilter || p.network?.toLowerCase() === networkFilter;
    const matchesType = !typeFilter || p.plan_type?.toLowerCase() === typeFilter;
    return matchesSearch && matchesNetwork && matchesType;
  });

  return (
    <Card className="overflow-hidden">
      <Toolbar>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans…"
            className={`${inputCls} pl-9 py-2`}
          />
        </div>
        <SelectFilter
          placeholder="All networks"
          options={networkOptions}
          value={networkFilter}
          onChange={setNetworkFilter}
        />
        <SelectFilter
          placeholder="All types"
          options={typeOptions}
          value={typeFilter}
          onChange={setTypeFilter}
        />
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={() => navigate("/admin/products/airtime-data/data-plans/new")}
        >
          <Plus className="w-3.5 h-3.5" />
          Add plan
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
          icon={Database}
          title={
            search || networkFilter || typeFilter
              ? "No data plans match your filters"
              : "No data plans added"
          }
          description={
            search || networkFilter || typeFilter
              ? "Try a different search or filter."
              : "Add data plan bundles per network and type to make them available for purchase."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  "Plan",
                  "Network",
                  "Type",
                  "Price (₦)",
                  "Validity",
                  "Status",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap ${i === 6 ? "text-left" : i === 0 ? "text-left" : "text-right"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((plan) => {
                const currentId = toId(plan.id);
                const displayPrice = plan.pricing?.user ?? plan.price;

                return (
                  <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">
                      {plan.plan ?? `${plan.plan_name}${plan.plan_size}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right capitalize">
                      {plan.network}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">
                      {plan.plan_type}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">
                      {formatCurrency(displayPrice)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">
                      {plan.validity}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">
                      <StatusBadge status={plan.active ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="relative inline-flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === currentId ? null : currentId,
                            );
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openMenuId === currentId && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-8 z-20 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/admin/products/airtime-data/data-plans/${toId(plan.id)}/edit`,
                                    { state: { dataPlan: plan } },
                                  );
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
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
