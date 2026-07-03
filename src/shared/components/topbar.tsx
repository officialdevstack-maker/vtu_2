import { Bell, Menu, Search, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/services": "All Services",
  "/transactions": "Transactions",
  "/wallet": "Fund Wallet",
  "/notifications": "Notifications",
  "/profile": "My Profile",
  "/settings": "Settings",
  "/support": "Support",
  "/referral": "Referral Program",
  "/beneficiaries": "Beneficiaries",
  "/buy-airtime": "Buy Airtime",
  "/buy-data": "Buy Data",
  "/cable-tv": "Cable TV",
  "/electricity": "Electricity",
  "/pricing": "Pricing",
  "/admin": "Admin Dashboard",
};

export default function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] ?? "KORA";

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-3 shrink-0">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-700 hover:bg-gray-100 rounded-md transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-slate-900 font-semibold text-sm truncate">{title}</h1>

      {/* Search bar - hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-60 ml-4 focus-within:border-indigo-400 focus-within:bg-white transition-colors">
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Notification */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2 rounded-md hover:bg-gray-100 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>

        {/* Settings shortcut */}
        <button
          onClick={() => navigate("/settings")}
          className="p-2 rounded-md hover:bg-gray-100 text-slate-500 hover:text-slate-700 transition-colors hidden sm:flex"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1.5 hidden sm:block" />

        {/* User profile */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 px-1.5 py-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
            CO
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-slate-900 leading-tight">Rara Avis</p>
            <p className="text-[11px] text-slate-400 leading-tight">User</p>
          </div>
        </button>
      </div>
    </header>
  );
}
