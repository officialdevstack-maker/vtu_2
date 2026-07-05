import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Bell,
  Settings,
  LogOut,
  Receipt,
  Wallet,
  HelpCircle,
  Share2,
  Users,
  Phone,
  Wifi,
  Tv,
  Plug,
  CreditCard,
  Zap,
  BarChart3,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../shared/providers/auth";
import { customerService } from "../services/customerService";

const initialsOf = (name?: string) =>
  (name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
};

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: "Main",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      { id: "wallet", label: "Fund wallet", icon: Wallet, path: "/wallet" },
      {
        id: "transactions",
        label: "Transactions",
        icon: Receipt,
        path: "/transactions",
      },
    ],
  },
  {
    label: "Services",
    items: [
      {
        id: "buy-airtime",
        label: "Buy airtime",
        icon: Phone,
        path: "/buy-airtime",
      },
      { id: "buy-data", label: "Buy data", icon: Wifi, path: "/buy-data" },
      { id: "cable-tv", label: "Cable TV", icon: Tv, path: "/cable-tv" },
      {
        id: "electricity",
        label: "Electricity",
        icon: Plug,
        path: "/electricity",
      },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "pricing", label: "Pricing", icon: CreditCard, path: "/pricing" },
      { id: "referral", label: "Referral", icon: Share2, path: "/referral" },
      {
        id: "beneficiaries",
        label: "Beneficiaries",
        icon: Users,
        path: "/beneficiaries",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        path: "/notifications",
        badge: 3,
      },
      { id: "support", label: "Support", icon: HelpCircle, path: "/support" },
    ],
  },
];

// Only shown to users whose role carries switch_account — see the same
// permission check gating the dropdown item in the footer avatar menu below.
const adminNavItem: NavItem = { id: "admin", label: "Admin", icon: BarChart3, path: "/admin" };

const bottomItems: NavItem[] = [
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapsed,
}: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const prefetchDashboard = () =>
    queryClient.prefetchQuery({ queryKey: ["networks"], queryFn: () => customerService.getNetworks() });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const canSwitchAccount = hasPermission("switch_account");
  const displayName = user?.fullname ?? user?.username ?? "there";
  const displayEmail = user?.email ?? "";

  const visibleSections = useMemo(() => {
    if (!canSwitchAccount) return sections;
    return sections.map((s) =>
      s.label === "Account" ? { ...s, items: [...s.items, adminNavItem] } : s,
    );
  }, [canSwitchAccount]);

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setShowLogoutModal(false);
    setIsLoggingOut(false);
    navigate("/login");
  };

  const handleSwitchToAdminView = () => {
    setAccountMenuOpen(false);
    onClose();
    navigate("/admin");
  };

  const goToSettings = () => {
    setAccountMenuOpen(false);
    go("/settings");
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-gray-900 shadow-2xl transition-[transform,width] duration-300 ease-out shrink-0 w-72 max-w-[85vw] sm:w-72 lg:sticky lg:inset-auto lg:shadow-none ${
          collapsed ? "lg:w-20" : "lg:w-64"
        } ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Collapse toggle (desktop only) */}
        <button
          onClick={onToggleCollapsed}
          className="hidden lg:flex absolute -right-3 top-5 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-slate-500 hover:text-slate-700 hover:border-gray-300 shadow-sm transition-colors z-10"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Logo */}
        <div
          className={`h-14 flex items-center border-b border-white/10 shrink-0 ${collapsed ? "lg:justify-center lg:px-0 px-4" : "px-4"}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <p
              className={`text-white font-semibold text-sm leading-tight ${collapsed ? "lg:hidden" : ""}`}
            >
              KORA
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 overflow-y-auto overflow-x-hidden space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {visibleSections.map((section) => (
            <div key={section.label}>
              <p
                className={`text-[11px] font-medium tracking-wide text-white/35 mb-1.5 px-2.5 ${collapsed ? "lg:hidden" : ""}`}
              >
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.id}
                      onClick={() => go(item.path)}
                      onMouseEnter={item.id === "dashboard" ? prefetchDashboard : undefined}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors relative ${collapsed ? "lg:justify-center" : ""} ${
                        active
                          ? "bg-white/10 text-white font-medium"
                          : "text-white/60 hover:bg-white/5 hover:text-white/90"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span
                        className={`truncate ${collapsed ? "lg:hidden" : ""}`}
                      >
                        {item.label}
                      </span>
                      {"badge" in item && (
                        <span
                          className={`bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium shrink-0 ${collapsed ? "lg:absolute lg:top-1 lg:right-1 lg:w-2 lg:h-2 lg:text-[0px]" : "ml-auto w-4.5 h-4.5"}`}
                        >
                          {String(item.badge)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom items */}
        <div className="px-2.5 pb-2 border-t border-white/10 pt-2 shrink-0">
          <div className="space-y-0.5 mb-2">
            {bottomItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.path)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${collapsed ? "lg:justify-center" : ""} ${
                    active
                      ? "bg-white/10 text-white font-medium"
                      : "text-white/60 hover:bg-white/5 hover:text-white/90"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className={collapsed ? "lg:hidden" : ""}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
          {/* User footer */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountMenuOpen((o) => !o)}
              className={`flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors group ${collapsed ? "lg:justify-center" : ""}`}
            >
              <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0">
                {initialsOf(displayName)}
              </div>
              <div className={`flex-1 min-w-0 text-left ${collapsed ? "lg:hidden" : ""}`}>
                <p className="text-xs font-medium text-white truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[11px] truncate text-white/40">
                  {displayEmail}
                </p>
              </div>
              <LogOut
                className={`w-3.5 h-3.5 text-white/30 group-hover:text-white/60 shrink-0 ${collapsed ? "lg:hidden" : ""}`}
              />
            </button>

            {accountMenuOpen ? (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setAccountMenuOpen(false)}
                />
                <div className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-xl border border-white/10 bg-gray-900 py-1 shadow-2xl">
                  <button
                    type="button"
                    onClick={goToSettings}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </button>
                  {canSwitchAccount && (
                    <button
                      type="button"
                      onClick={handleSwitchToAdminView}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" /> Switch to admin view
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Log out
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </aside>

      {showLogoutModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 shadow-2xl">
            <p className="text-lg font-semibold text-slate-900">Sign out?</p>
            <p className="mt-2 text-sm text-slate-600">
              You’ll be redirected to the login screen after your session is
              ended.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoggingOut ? "Signing out..." : "Yes, sign out"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
