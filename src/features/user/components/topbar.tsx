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
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 lg:px-6 gap-3 shrink-0 shadow-sm">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 -ml-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-gray-900 font-semibold text-sm sm:text-base truncate">{title}</h1>

      {/* Search bar - hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-64 hover:border-indigo-300 transition-colors focus-within:border-indigo-400 focus-within:bg-white">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search here..."
          className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notification */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition group"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* Settings shortcut */}
        <button
          onClick={() => navigate("/settings")}
          className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition hidden sm:flex"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

        {/* User profile */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-gray-100 transition"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm">
            CO
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-gray-900 leading-tight">Rara Avis</p>
            <p className="text-xs text-gray-400 leading-tight">User</p>
          </div>
        </button>
      </div>
    </header>
  );
}
