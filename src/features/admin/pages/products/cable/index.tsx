import { useSearchParams } from "react-router";
import { PageHeader } from "../../../../user/components/shared-ui";
import { CableNetworksTab } from "./cable-networks-tab";
import { CablePlansTab } from "./cable-plans-tab";

type Tab = "network" | "plans";

const tabs: { id: Tab; label: string }[] = [
  { id: "network", label: "Cable Networks" },
  { id: "plans", label: "Cable Plans" },
];

const CablePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as Tab | null) ?? "network";
  const setActiveTab = (tab: Tab) => setSearchParams({ tab }, { replace: true });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cable"
        description="Cable TV networks and plans — a fixed subscription cost plus a per-role charge fee, not a full replacement price."
      />

      <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "network" && <CableNetworksTab />}
      {activeTab === "plans" && <CablePlansTab />}
    </div>
  );
};

export default CablePage;
