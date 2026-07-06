import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  CalendarClock,
  SlidersHorizontal,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  SkeletonLine,
  StatusBadge,
} from "../../../user/components/shared-ui";
import { Toolbar, SelectFilter } from "../products/airtime-data/shared";
import { discountService, type Discount } from "./service";

const SERVICE_LABELS: Record<string, string> = {
  airtime: "Airtime",
  data: "Data",
  cable: "Cable",
  electricity: "Electricity",
  exam: "Exam",
  airtimeToCash: "Airtime to Cash",
  user_upgrade: "Account Upgrade",
};

const formatValue = (discount: Discount) => {
  const n = Number(discount.value);
  return discount.discount_type === "fixed" ? `₦${n.toLocaleString()} off` : `${n}% off`;
};

const formatWindow = (discount: Discount) => {
  if (!discount.starts_at && !discount.ends_at) return "Always on";
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  if (discount.starts_at && discount.ends_at) return `${fmt(discount.starts_at)} – ${fmt(discount.ends_at)}`;
  if (discount.starts_at) return `From ${fmt(discount.starts_at)}`;
  return `Until ${fmt(discount.ends_at as string)}`;
};

// "active"/"inactive" are the only two badge colors backed by shared-ui's
// statusMap that make sense here without touching that shared component —
// scheduled (upcoming) borrows "pending" (amber) instead of a new color.
const discountStatus = (discount: Discount): string => {
  if (!discount.active) return "inactive";
  const today = new Date().toISOString().slice(0, 10);
  if (discount.starts_at && today < discount.starts_at) return "pending";
  if (discount.ends_at && today > discount.ends_at) return "inactive";
  return "active";
};

const MENU_WIDTH = 144; // w-36

function DiscountsPage() {
  const navigate = useNavigate();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // The table scrolls horizontally (overflow-x-auto), which forces
  // overflow-y to auto too per the CSS spec — an `absolute` dropdown would
  // get clipped by that. Fixed-positioning it from the trigger's own
  // bounding rect escapes the table's overflow context entirely.
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (discount: Discount) => {
    setDeletingId(toId(discount.id));
    setOpenMenuId(null);
    try {
      await discountService.remove(discount.id);
      setDiscounts((prev) => prev.filter((d) => toId(d.id) !== toId(discount.id)));
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

  const serviceOptions = useMemo(
    () =>
      Array.from(new Set(discounts.map((d) => d.service_type))).map((service) => ({
        value: service,
        label: SERVICE_LABELS[service] ?? service,
      })),
    [discounts],
  );

  const filtered = discounts.filter((d) => !serviceFilter || d.service_type === serviceFilter);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Discount"
        description="Flash-sale price cuts for any service — a flat percentage or fixed amount off, optionally scoped to one network and scheduled to a date window. Distinct from opt-in Promo Codes."
        actions={
          <Button size="sm" onClick={() => navigate("/admin/growth/discounts/new")}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            New discount
          </Button>
        }
      />

      <Card className="overflow-visible">
        <Toolbar>
          <SelectFilter
            placeholder="All services"
            options={serviceOptions}
            value={serviceFilter}
            onChange={setServiceFilter}
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
            icon={CalendarClock}
            title={serviceFilter ? "No discounts for this service" : "No flash-sale discounts yet"}
            description={
              serviceFilter
                ? "Try a different service or add a discount for it."
                : "Slash pricing for any service, optionally scoped to a network and scheduled to a date window."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Name", "Service | Network", "Value", "Window", "Status", "Actions"].map((h) => (
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
                {filtered.map((discount) => {
                  const currentId = toId(discount.id);

                  return (
                    <tr key={discount.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs font-medium text-slate-900">{discount.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {SERVICE_LABELS[discount.service_type] ?? discount.service_type}
                        {discount.network ? ` | ${discount.network}` : " | All networks"}
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-900">{formatValue(discount)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {formatWindow(discount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={discountStatus(discount)} />
                      </td>
                      <td className="px-4 py-3 text-center">
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
                                  navigate(`/admin/growth/discounts/${toId(discount.id)}/edit`, {
                                    state: { discount },
                                  });
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default DiscountsPage;
