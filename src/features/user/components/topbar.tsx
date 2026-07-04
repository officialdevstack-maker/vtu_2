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

export default function Topbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] ?? "KORA";

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-full items-center gap-2 px-3 sm:px-4 lg:px-6">
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 -ml-1 text-slate-500 transition-colors hover:bg-gray-100 hover:text-slate-700 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <h1 className="truncate text-sm font-semibold text-slate-900">
            {title}
          </h1>

          <div className="ml-auto hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 transition-colors focus-within:border-indigo-400 focus-within:bg-white md:flex md:w-56 lg:w-64">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => navigate("/notifications")}
            className="relative rounded-md p-2 text-slate-500 transition-colors hover:bg-gray-100 hover:text-slate-700"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="hidden rounded-md p-2 text-slate-500 transition-colors hover:bg-gray-100 hover:text-slate-700 sm:flex"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>

          <div className="mx-1 hidden h-5 w-px bg-gray-200 sm:block" />

          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-gray-100"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">
              CO
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-medium leading-tight text-slate-900">
                Rara Avis
              </p>
              <p className="text-[11px] leading-tight text-slate-400">User</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
