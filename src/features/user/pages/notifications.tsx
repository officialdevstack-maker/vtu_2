import { CheckCircle2, AlertCircle, XCircle, Bell } from "lucide-react";
import type { ReactElement } from "react";
import { PageHeader, Card } from "../components/shared-ui";

export default function NotificationsPage() {
  const notifs = [
    { id: 1, title: "Transaction successful", body: "Your MTN Airtime purchase of ₦500 to 08012345678 was successful.", time: "2 minutes ago", read: false, type: "success" },
    { id: 2, title: "Low balance alert", body: "Your wallet balance has dropped below ₦5,000. Fund your wallet to continue.", time: "1 hour ago", read: false, type: "warning" },
    { id: 3, title: "Transaction failed", body: "Your bank transfer of ₦10,000 to First Bank — John Doe could not be processed.", time: "2 days ago", read: true, type: "error" },
    { id: 4, title: "Wallet funded", body: "₦20,000 has been credited to your wallet via bank transfer from Access Bank.", time: "3 days ago", read: true, type: "success" },
    { id: 5, title: "Referral bonus", body: "You earned a ₦500 referral bonus! Adaeze Nwosu just completed her first transaction.", time: "5 days ago", read: true, type: "info" },
  ];

  const typeStyles: Record<string, string> = {
    success: "bg-emerald-50",
    warning: "bg-amber-50",
    error: "bg-red-50",
    info: "bg-blue-50",
  };

  const typeIcons: Record<string, ReactElement> = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-600" />,
    error: <XCircle className="w-4 h-4 text-red-600" />,
    info: <Bell className="w-4 h-4 text-blue-600" />,
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        description={`${notifs.filter((n) => !n.read).length} unread`}
        actions={<button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">Mark all as read</button>}
      />
      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-100">
          {notifs.map((n) => (
            <div
              key={n.id}
              className={`flex gap-3.5 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? "bg-indigo-50/40" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full ${typeStyles[n.type]} flex items-center justify-center shrink-0 mt-0.5`}>
                {typeIcons[n.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-slate-900 text-sm font-medium">{n.title}</p>
                  {!n.read && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0" />}
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">{n.body}</p>
                <p className="text-slate-400 text-xs mt-1.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
