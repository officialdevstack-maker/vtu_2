import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../../user/components/shared-ui";
import { GeneralTab } from "./general-tab";
import { TransactionTab } from "./transaction-tab";
import { NotificationTab } from "./notification-tab";
import { EmailTab } from "./email-tab";
import { CustomerTab } from "./customer-tab";
import { PaymentTab } from "./payment-tab";
import { DangerZoneTab } from "./danger-zone-tab";

type Tab = "general" | "transaction" | "notification" | "email" | "customer" | "payment" | "danger";

const tabs: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "transaction", label: "Transaction" },
  { id: "notification", label: "Notification" },
  { id: "email", label: "Email" },
  { id: "customer", label: "Customer" },
  { id: "payment", label: "Payment" },
  { id: "danger", label: "Danger zone" },
];

const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as Tab | null) ?? "general";
  const setActiveTab = (tab: Tab) => setSearchParams({ tab }, { replace: true });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Configure platform-wide behavior — info, transactions, notifications, email, customers, and payouts."
      />

      <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              t.id === "danger"
                ? activeTab === t.id
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-red-500 hover:text-red-600"
                : activeTab === t.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "general" && <GeneralTab />}
      {activeTab === "transaction" && <TransactionTab />}
      {activeTab === "notification" && <NotificationTab />}
      {activeTab === "email" && <EmailTab />}
      {activeTab === "customer" && <CustomerTab />}
      {activeTab === "payment" && <PaymentTab />}
      {activeTab === "danger" && <DangerZoneTab />}
    </div>
  );
};

export default SettingsPage;
