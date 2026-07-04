import { useState } from "react";
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
  const [activeTab, setActiveTab] = useState<Tab>("network");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Airtime & Data"
        description="Configure networks, types, pricing discounts, plans, and PIN inventory."
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
