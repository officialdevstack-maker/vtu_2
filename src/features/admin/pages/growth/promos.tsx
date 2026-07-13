import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Percent, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  SkeletonLine,
  StatusBadge,
} from "../../../user/components/shared-ui";
import { Toolbar, SelectFilter } from "../products/airtime-data/shared";
import { promotionService, type Promotion } from "./service";

const formatValue = (promo: Promotion) => {
  const n = Number(promo.value);
  switch (promo.type) {
    case "percentage":
      return `${n}%`;
    case "fixed":
      return `₦${n.toLocaleString()}`;
    case "bonus_data":
      return `${n.toLocaleString()}MB`;
    case "cashback":
      return `₦${n.toLocaleString()} cashback`;
    default:
      return String(n);
  }
};

export default function PromosPage() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    promotionService
      .getAll()
      .then(setPromotions)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (promo: Promotion) => {
    setDeletingId(promo.id);
    setOpenMenuId(null);
    try {
      await promotionService.remove(promo.id);
      setPromotions((prev) => prev.filter((p) => p.id !== promo.id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (promo: Promotion) => {
    const updated = await promotionService.toggleStatus(promo);
    setPromotions((prev) => prev.map((p) => (p.id === promo.id ? updated : p)));
  };

  const productOptions = useMemo(
    () =>
      Array.from(
        new Set(
          promotions.flatMap(
            (p) => p.products ?? (p.product ? [p.product] : []),
          ),
        ),
      ),
    [promotions],
  );

  const filtered = promotions.filter((p) => {
    if (!productFilter) return true;
    const products = p.products ?? (p.product ? [p.product] : []);
    return products.includes(productFilter as Promotion["product"]);
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Promo codes"
        description="Opt-in codes and admin-triggered offers — separate from per-network Discounts, which apply automatically with no code."
        actions={
          <Button
            size="sm"
            onClick={() => navigate("/admin/growth/promos/new")}
          >
            <Plus className="w-3.5 h-3.5" /> New promo
          </Button>
        }
      />

      <Card className="overflow-visible">
        <Toolbar>
          <SelectFilter
            placeholder="All products"
            options={productOptions}
            value={productFilter}
            onChange={setProductFilter}
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
            icon={Percent}
            title={
              productFilter
                ? "No promos for this product"
                : "No promo codes yet"
            }
            description={
              productFilter
                ? "Try a different product filter."
                : "Create a code-based or admin-triggered promotional offer."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "Name",
                    "Code",
                    "Target / Product",
                    "Value",
                    "Usage",
                    "Status",
                    "Actions",
                  ].map((h) => (
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
                {filtered.map((promo) => (
                  <tr
                    key={promo.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">
                      {promo.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {promo.apply === "code" ? (
                        <span className="font-mono">{promo.code}</span>
                      ) : (
                        <span className="text-slate-400">Auto-applied</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 capitalize">
                      {promo.target} /{" "}
                      {(
                        promo.products ?? (promo.product ? [promo.product] : [])
                      ).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {formatValue(promo)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {promo.used}
                      {promo.usage_limit_total
                        ? ` / ${promo.usage_limit_total}`
                        : ""}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleActive(promo)}>
                        <StatusBadge
                          status={promo.active ? "active" : "inactive"}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-flex justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === promo.id ? null : promo.id,
                            );
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openMenuId === promo.id && (
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
                                    `/admin/growth/promos/${promo.id}/edit`,
                                    {
                                      state: { promotion: promo },
                                    },
                                  );
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                disabled={deletingId === promo.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDelete(promo);
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
