import { useEffect, useMemo, useState } from "react";
import { Layers, Radio, Server } from "lucide-react";
import {
  PageHeader,
  Card,
  EmptyState,
  StatusBadge,
  SkeletonLine,
  Toggle,
  selectCls,
} from "../../user/components/shared-ui";
import {
  serviceControlService,
  type ServiceControlGroups,
  type ServiceControlItem,
} from "./serviceControlService";
import {
  networkTypeService,
  type NetworkType,
} from "./products/airtime-data/service";
import { providerService, type Provider } from "./apis/providerService";

// ─── Global default providers ───────────────────────────────────────────────
// A network type (e.g. "sme" data, "vtu" airtime) can attach a provider
// explicitly per-plan (providerable pivot). When a plan doesn't, purchases
// fall back to the network type's own `provider_id` — its "global default
// provider". Assigning one here is what makes that fallback resolve to a
// real vendor instead of null.

function DefaultProvidersCard() {
  const [types, setTypes] = useState<NetworkType[]>([]);
  const [vendors, setVendors] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([networkTypeService.getAll(), providerService.getAll()])
      .then(([t, v]) => {
        setTypes(t);
        setVendors(v);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = async (type: NetworkType, providerId: string) => {
    const id = String(type.id);
    setSavingId(id);
    try {
      const updated = await networkTypeService.update(id, {
        provider_id: providerId ? providerId : null,
      });
      setTypes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
          <Server className="w-4 h-4 text-[#111827]" />
          Global default providers
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          The vendor used to fulfil a plan when it doesn't have its own
          provider override attached.
        </p>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="h-3 w-16" />
              <SkeletonLine className="h-7 flex-1" />
            </div>
          ))}
        </div>
      ) : types.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No service types configured"
          description="Add a type under Products → Airtime & Data first."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Type", "Service", "Default provider"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap ${i === 2 ? "w-64" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {types.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 text-xs capitalize">
                    {t.name}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 capitalize">
                    {t.service_type}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={t.provider_id ?? ""}
                      disabled={savingId === String(t.id)}
                      onChange={(e) => handleChange(t, e.target.value)}
                      className={`${selectCls} disabled:opacity-50`}
                    >
                      <option value="">No default (none)</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── Service availability toggles ───────────────────────────────────────────

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

  const categories = useMemo(() => Object.entries(groups), [groups]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Service Control"
        description="Control which services users can use, and the default provider each falls back to."
      />

      <DefaultProvidersCard />

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
            title="No services configured"
            description="Service controls will appear here once seeded."
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
