import { useEffect, useMemo, useState } from "react";
import { Radio } from "lucide-react";
import {
  PageHeader,
  Card,
  EmptyState,
  StatusBadge,
  SkeletonLine,
  Toggle,
} from "../../user/components/shared-ui";
import {
  serviceControlService,
  type ServiceControlGroups,
  type ServiceControlItem,
} from "./serviceControlService";

// ─── Service availability toggles ───────────────────────────────────────────
// Only the "transaction" category's payment-gateway/bank sub-groups are shown
// here — this is the only admin surface for Provider::scopeGetPaymentProviders()
// (which gates Payment::generateAccount()). The "pin" sub-category under the
// same category is managed at Settings → Transaction instead, and every other
// category (airtime/data/cable/exam/electricity/recharge pin) is superseded by
// the real Airtime Plan/Data Plan/Cable Plan/Bill Plan `active` flags.

function ServiceGroupCard({
  category,
  subGroups,
  togglingId,
  onToggle,
}: {
  category: string;
  subGroups: Record<string, ServiceControlItem[]>;
  togglingId: string | null;
  onToggle: (item: ServiceControlItem) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-slate-900 text-sm capitalize">
          {category}
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {Object.entries(subGroups).map(([subCategory, items]) => (
          <div key={subCategory} className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2.5">
              {subCategory}
            </p>
            <div className="space-y-2.5">
              {items.map((item) => {
                const id = String(item.id);
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-slate-800 capitalize truncate">
                        {item.name}
                      </span>
                      <StatusBadge
                        status={item.isActive ? "active" : "inactive"}
                      />
                    </div>
                    <Toggle
                      value={item.isActive}
                      onChange={() =>
                        togglingId === id ? undefined : onToggle(item)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const VISIBLE_CATEGORY = "transaction";
const VISIBLE_SUB_CATEGORIES = ["payment gateway", "bank"];

const ServiceControlPage = () => {
  const [groups, setGroups] = useState<ServiceControlGroups>({});
  const [loading, setLoading] = useState(true);

  const load = () => serviceControlService.getAll().then(setGroups);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (item: ServiceControlItem) => {
    const id = String(item.id);
    setTogglingId(id);
    // Optimistic flip so the switch feels instant; reconciled on refetch below.
    setGroups((prev) => ({
      ...prev,
      [item.category]: {
        ...prev[item.category],
        [item.sub_category]: prev[item.category][item.sub_category].map((i) =>
          i.id === item.id ? { ...i, isActive: !i.isActive } : i,
        ),
      },
    }));
    try {
      await serviceControlService.toggle(item);
    } finally {
      setTogglingId(null);
    }
  };

  const categories = useMemo(() => {
    const subGroups = groups[VISIBLE_CATEGORY];
    if (!subGroups) return [];
    const filtered = Object.fromEntries(
      VISIBLE_SUB_CATEGORIES.filter((sub) => subGroups[sub]?.length).map((sub) => [sub, subGroups[sub]]),
    );
    return Object.keys(filtered).length > 0 ? [[VISIBLE_CATEGORY, filtered] as const] : [];
  }, [groups]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payment Gateway Controls"
        description="Turn payment gateways and bank options on or off for customer wallet funding."
      />

      {loading ? (
        <Card className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <SkeletonLine className="h-3 w-32" />
              <SkeletonLine className="h-5 w-10 rounded-full" />
            </div>
          ))}
        </Card>
      ) : categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={Radio}
            title="No payment gateways configured"
            description="Payment gateway controls will appear here once seeded."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {categories.map(([category, subGroups]) => (
            <ServiceGroupCard
              key={category}
              category={category}
              subGroups={subGroups}
              togglingId={togglingId}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceControlPage;
