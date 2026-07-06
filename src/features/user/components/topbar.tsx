import { useState } from "react";
import { ArrowLeftRight, ArrowUpCircle, Bell, LogOut, Menu, Search, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/providers/auth";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/services": "All Services",
  "/transactions": "Transactions",
  "/wallet": "Fund Wallet",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/upgrade-account": "Upgrade Account",
  "/referral": "Referral Program",
  "/beneficiaries": "Beneficiaries",
  "/buy-airtime": "Buy Airtime",
  "/buy-data": "Buy Data",
  "/cable-tv": "Cable TV",
  "/electricity": "Electricity",
  "/pricing": "Pricing",
  "/admin": "Admin Dashboard",
};

const initialsOf = (name?: string) =>
  (name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

export default function Topbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const title = pageTitles[location.pathname] ?? "KORA";

  const displayName = user?.username ?? "there";
  const canSwitchAccount = hasPermission("switch_account");

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

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

          <div className="ml-auto hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 transition-colors focus-within:border-[#111827]/40 focus-within:bg-white md:flex md:w-56 lg:w-64">
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

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-gray-100"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111827] text-xs font-medium text-white">
                {initialsOf(displayName)}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-medium leading-tight text-slate-900">
                  {displayName}
                </p>
                <p className="text-[11px] leading-tight text-slate-400">User</p>
              </div>
            </button>

            {menuOpen ? (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/settings");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                  >
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/upgrade-account");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                  >
                    <ArrowUpCircle className="h-3.5 w-3.5" /> Upgrade account
                  </button>
                  {canSwitchAccount && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/admin");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" /> Switch to admin view
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Log out
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
