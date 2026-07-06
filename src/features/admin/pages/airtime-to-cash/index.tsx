import { useSearchParams } from "react-router";
import { PageHeader } from "../../../user/components/shared-ui";
import { AirtimeToCashRequestsTab } from "./requests-tab";
import { AirtimeToCashNetworksTab } from "./networks-tab";

type Tab = "requests" | "networks";

const tabs: { id: Tab; label: string }[] = [
  { id: "requests", label: "Requests" },
  { id: "networks", label: "Networks" },
];

const AirtimeToCashPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as Tab | null) ?? "requests";
  const setActiveTab = (tab: Tab) => setSearchParams({ tab }, { replace: true });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Airtime to Cash"
        description="Review customer airtime-to-cash submissions and manage the destination number and rate range per network."
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

      {activeTab === "requests" && <AirtimeToCashRequestsTab />}
      {activeTab === "networks" && <AirtimeToCashNetworksTab />}
    </div>
  );
};

export default AirtimeToCashPage;
