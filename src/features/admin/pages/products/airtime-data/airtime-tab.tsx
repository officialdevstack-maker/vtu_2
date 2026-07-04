import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  PhoneCall,
  SlidersHorizontal,
  MoreVertical,
  Pencil,
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
import { discountService, type Discount } from "./service";

const formatCurrency = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(value);
};

export function AirtimeTab() {
  const navigate = useNavigate();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkFilter, setNetworkFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toId = (value: string | number) => String(value);

  const handleDelete = async (discount: Discount) => {
    setDeletingId(toId(discount.id));
    setOpenMenuId(null);
    try {
      await discountService.remove(toId(discount.id));
      setDiscounts((prev) =>
        prev.filter((d) => toId(d.id) !== toId(discount.id)),
      );
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    discountService
      .getAll()
      .then(setDiscounts)
      .finally(() => setLoading(false));
  }, []);

  const networkOptions = useMemo(
    () =>
      Array.from(new Set(discounts.map((d) => d.network).filter(Boolean))).map(
        (network) => ({ value: network.toLowerCase(), label: network }),
      ),
    [discounts],
  );

  const filtered = discounts.filter((d) => {
    const q = networkFilter.toLowerCase();
    return !q || d.network?.toLowerCase() === q;
  });

  return (
    <Card className="overflow-visible">
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
          onClick={() => navigate("/admin/products/airtime-data/discounts/new")}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Set discount
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
              ? "No discounts for this network"
              : "No airtime discounts configured"
          }
          description={
            networkFilter
              ? "Try a different network or add a discount for it."
              : "Set a discount rate per network to control airtime pricing."
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
              {filtered.map((discount) => {
                const isEnabled = Boolean(discount.active ?? false);
                const currentId = toId(discount.id);

                return (
                  <tr
                    key={discount.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">
                      {discount.network}|{discount.category}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">
                      {formatCurrency(discount.min)}|
                      {formatCurrency(discount.max)}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600 text-right">
                      <StatusBadge status={isEnabled ? "active" : "inactive"} />
                    </td>

                    <td className="px-4 py-3 text-center">
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
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-30 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/admin/products/airtime-data/discounts/${toId(discount.id)}/edit`,
                                    { state: { discount } },
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
                                  void handleDelete(discount);
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
