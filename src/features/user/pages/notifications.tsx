import { CheckCircle, AlertCircle, XCircle, Bell } from "lucide-react";
import type { ReactElement } from "react";

export default function NotificationsPage() {
  const notifs = [
    { id: 1, title: "Transaction Successful", body: "Your MTN Airtime purchase of \u20A6500 to 08012345678 was successful.", time: "2 minutes ago", read: false, type: "success" },
    { id: 2, title: "Low Balance Alert", body: "Your wallet balance has dropped below \u20A65,000. Fund your wallet to continue.", time: "1 hour ago", read: false, type: "warning" },
    { id: 3, title: "Transaction Failed", body: "Your bank transfer of \u20A610,000 to First Bank \u2014 John Doe could not be processed.", time: "2 days ago", read: true, type: "error" },
    { id: 4, title: "Wallet Funded", body: "\u20A620,000 has been credited to your wallet via bank transfer from Access Bank.", time: "3 days ago", read: true, type: "success" },
    { id: 5, title: "Referral Bonus", body: "You earned a \u20A6500 referral bonus! Adaeze Nwosu just completed her first transaction.", time: "5 days ago", read: true, type: "info" },
  ];

  const typeStyles: Record<string, string> = {
    success: "bg-emerald-50",
    warning: "bg-amber-50",
    error: "bg-red-50",
    info: "bg-blue-50",
  };

  const typeIcons: Record<string, ReactElement> = {
    success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-500" />,
    error: <XCircle className="w-4 h-4 text-red-500" />,
    info: <Bell className="w-4 h-4 text-blue-500" />,
  };

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">{notifs.filter((n) => !n.read).length} unread</p>
        <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">Mark all as read</button>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
        {notifs.map((n) => (
          <div
            key={n.id}
            className={`flex gap-4 p-4 hover:bg-gray-50 transition cursor-pointer ${!n.read ? "bg-indigo-50/30" : ""}`}
          >
            <div className={`w-9 h-9 rounded-full ${typeStyles[n.type]} flex items-center justify-center shrink-0 mt-0.5`}>
              {typeIcons[n.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-gray-900 text-sm font-medium">{n.title}</p>
                {!n.read && <span className="w-2 h-2 bg-indigo-600 rounded-full shrink-0" />}
              </div>
              <p className="text-gray-500 text-xs leading-relaxed">{n.body}</p>
              <p className="text-gray-400 text-xs mt-1.5">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
