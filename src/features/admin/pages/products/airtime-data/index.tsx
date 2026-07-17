import { useSearchParams } from "react-router";
import { PageHeader } from "../../../../user/components/shared-ui";
import { NetworkTab } from "./network-tab";
import { TypeTab } from "./type-tab";
import { AirtimeTab } from "./airtime-tab";
import { DataPlansTab } from "./data-plans-tab";
import { AirtimePinsTab } from "./airtime-pins-tab";
import { DataPinsTab } from "./data-pins-tab";

type Tab = "network" | "type" | "airtime" | "data-plans" | "airtime-pins" | "data-pins";

const tabs: { id: Tab; label: string }[] = [
  { id: "network", label: "Network" },
  { id: "type", label: "Type" },
  { id: "airtime", label: "Airtime" },
  { id: "data-plans", label: "Data Plans" },
  { id: "airtime-pins", label: "Airtime Pins" },
  { id: "data-pins", label: "Data Pins" },
];

const AirtimeDataPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as Tab | null) ?? "network";
  const setActiveTab = (tab: Tab) => setSearchParams({ tab }, { replace: true });

  return (
    <div className="min-w-0 space-y-5">
      <PageHeader
        title="Airtime & Data"
        description="Configure networks, types, airtime plans, data plans, and PIN inventory."
      />

      <div className="max-w-full overflow-x-auto rounded-lg bg-gray-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`segmented-swatch shrink-0 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                activeTab === t.id
                  ? "segmented-swatch-active"
                  : ""
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "network" && <NetworkTab />}
      {activeTab === "type" && <TypeTab />}
      {activeTab === "airtime" && <AirtimeTab />}
      {activeTab === "data-plans" && <DataPlansTab />}
      {activeTab === "airtime-pins" && <AirtimePinsTab />}
      {activeTab === "data-pins" && <DataPinsTab />}
    </div>
  );
};

export default AirtimeDataPage;
