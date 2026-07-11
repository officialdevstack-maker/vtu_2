import { useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useNavigation,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/shared/notificationService";
import {
  ArrowLeftRight,
  Banknote,
  Bell,
  BellRing,
  BookOpenCheck,
  Bot,
  Cable,
  ChevronRight,
  HelpCircle,
  LayoutGrid,
  Landmark,
  LogOut,
  Menu,
  Megaphone,
  Network,
  PlugZap,
  ReceiptText,
  Route,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wallet2,
  Wifi,
  X,
} from "lucide-react";
import { useAuth } from "../../../shared/providers/auth";
import { useBranding } from "@/shared/branding";
import { TopLoadingBar } from "../../user/components/shared-ui";
import DefaultCredentialsModal from "./DefaultCredentialsModal";
import { prefetchAdminDashboard } from "../pages/dashboardService";
import GlobalSearch from "@/shared/components/global-search";

const initialsOf = (name?: string) =>
  (name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

type NavChild = {
  label: string;
  path: string;
};

type NavItem = {
  label: string;
  path: string;
  icon: typeof LayoutGrid;
  children?: NavChild[];
};

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Core",
    items: [
      { label: "Dashboard", path: "/admin", icon: LayoutGrid },
      { label: "AI Manager", path: "/admin/ai-manager", icon: Bot },
      { label: "How it works", path: "/admin/help", icon: HelpCircle },
    ],
  },
  {
    title: "APIs",
    items: [
      { label: "Provider", path: "/admin/apis/provider", icon: PlugZap },
      {
        label: "Gateway",
        path: "/admin/apis/gateway",
        icon: SlidersHorizontal,
      },
      { label: "Service Routing", path: "/admin/apis/routing", icon: Route },
    ],
  },
  {
    title: "Products",
    items: [
      {
        label: "Airtime & Data",
        path: "/admin/products/airtime-data",
        icon: Wifi,
      },
      { label: "Cable", path: "/admin/products/cable", icon: Cable },
      { label: "Bill", path: "/admin/products/bill", icon: ReceiptText },
      { label: "Exam", path: "/admin/products/exam", icon: BookOpenCheck },
      {
        label: "Airtime to Cash",
        path: "/admin/airtime-to-cash",
        icon: Banknote,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Payment Gateways",
        path: "/admin/service-control",
        icon: Sparkles,
      },
      {
        label: "Wallet Withdrawals",
        path: "/admin/wallet-withdrawals",
        icon: Landmark,
      },
      {
        label: "Affiliates",
        path: "/admin/affiliates",
        icon: Network,
      },
      {
        label: "Customers",
        path: "/admin/customers/users",
        icon: Users,
        children: [
          { label: "All Customers", path: "/admin/customers/users" },
          { label: "Roles & Permissions", path: "/admin/customers/roles" },
        ],
      },
      {
        label: "Growth & Marketing",
        path: "/admin/growth",
        icon: Megaphone,
        children: [
          { label: "Discount", path: "/admin/growth/discounts" },
          { label: "Cashback", path: "/admin/growth/cashback" },
          { label: "Event", path: "/admin/growth/events" },
          { label: "Promo Codes", path: "/admin/growth/promos" },
        ],
      },
      { label: "Transactions", path: "/admin/transactions", icon: Wallet2 },
    ],
  },
  {
    title: "Communication",
    items: [
      {
        label: "Notifications",
        path: "/admin/notifications/broadcast",
        icon: BellRing,
        children: [
          { label: "Broadcast", path: "/admin/notifications/broadcast" },
          { label: "Welcome Message", path: "/admin/notifications/welcome" },
          { label: "Template", path: "/admin/notifications/template" },
        ],
      },
      { label: "Settings", path: "/admin/settings", icon: Settings },
    ],
  },
];

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { logout, user, hasPermission } = useAuth();
  const { app_name, logo } = useBranding();
  const queryClient = useQueryClient();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: Boolean(user),
    refetchInterval: 60000,
  });

  const displayName = user?.username ?? "Admin";
  const displayRole = user?.role?.name ?? "Admin";
  const canSwitchAccount = hasPermission("switch_account");

  const handleSwitchToUserView = () => {
    setSidebarMenuOpen(false);
    setHeaderMenuOpen(false);
    navigate("/dashboard");
  };

  const handleGoToAccountSettings = () => {
    setSidebarMenuOpen(false);
    setHeaderMenuOpen(false);
    navigate("/admin/account");
  };

  const isActive = (path: string) => {
    if (!path) return false;

    if (path === "/admin") {
      return location.pathname === path;
    }

    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const toggleExpanded = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path)
        ? prev.filter((item) => item !== path)
        : [...prev, path],
    );
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setMobileSidebarOpen(false);
    setShowLogoutModal(false);
    setIsLoggingOut(false);
    navigate("/login");
  };

  const renderSidebarContent = () => (
    <>
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#111827] shadow-sm shadow-[#111827]/20">
            {logo ? (
              <img
                src={logo}
                alt={app_name}
                className="h-full w-full object-contain"
              />
            ) : (
              <LayoutGrid className="h-5 w-5 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {app_name}
            </p>
            <p className="text-xs text-slate-400">Admin Center</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                const hasActiveChild =
                  item.children?.some((child) => isActive(child.path)) ?? false;
                const isExpanded =
                  expandedItems.includes(item.path) || hasActiveChild;

                return (
                  <div key={item.path}>
                    <div className="flex items-center rounded-xl">
                      <NavLink
                        to={item.path}
                        end={item.path === "/admin"}
                        onClick={() => setMobileSidebarOpen(false)}
                        onMouseEnter={
                          item.path === "/admin"
                            ? () => prefetchAdminDashboard(queryClient)
                            : undefined
                        }
                        className={({ isActive: linkActive }) =>
                          `flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                            linkActive || active
                              ? "bg-[#111827]/10 text-[#111827] font-medium"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                      </NavLink>

                      {item.children ? (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.path)}
                          className="rounded-r-xl px-2 py-2.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
                          aria-label={`Toggle ${item.label}`}
                        >
                          <ChevronRight
                            className={`h-3.5 w-3.5 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                      ) : null}
                    </div>

                    {item.children && isExpanded ? (
                      <div className="ml-7 mt-1 space-y-1 border-l border-slate-100 pl-3">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={({ isActive: childActive }) =>
                              `flex items-center rounded-lg px-2 py-1.5 text-sm transition-colors ${
                                childActive
                                  ? "text-[#111827] font-medium"
                                  : "text-slate-400 hover:text-slate-700"
                              }`
                            }
                          >
                            <span className="truncate">{child.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative border-t border-slate-100 px-3 py-3">
        <button
          type="button"
          onClick={() => setSidebarMenuOpen((o) => !o)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111827]/15 text-sm font-semibold text-[#111827]">
            {initialsOf(displayName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {displayName}
            </p>
            <p className="truncate text-xs text-slate-400">{displayRole}</p>
          </div>
        </button>

        {sidebarMenuOpen ? (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setSidebarMenuOpen(false)}
            />
            <div className="absolute bottom-full left-3 right-3 z-20 mb-2 rounded-xl border border-slate-200/70 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={handleGoToAccountSettings}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
              >
                <Settings className="h-3.5 w-3.5" /> Settings
              </button>
              {canSwitchAccount && (
                <button
                  type="button"
                  onClick={handleSwitchToUserView}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" /> Switch to user view
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSidebarMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-3.5 w-3.5" /> Log out
              </button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="admin-theme min-h-screen bg-app-bg text-slate-900">
      <TopLoadingBar active={navigation.state === "loading"} />
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex">
          {renderSidebarContent()}
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden lg:pl-64">
          <header className="sticky top-0 z-20 h-14 border-b border-slate-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="flex h-full min-w-0 items-center gap-2 px-3 sm:px-4 lg:px-6">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 lg:hidden"
                aria-label="Open admin navigation"
                aria-expanded={mobileSidebarOpen}
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#111827]">
                    Management
                  </p>
                  <h1 className="truncate text-sm font-semibold text-slate-900">
                    Admin control panel
                  </h1>
                </div>

                <div className="ml-auto hidden md:block">
                  <GlobalSearch
                    scope="admin"
                    wrapperClassName="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 transition-colors focus-within:border-[#111827]/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#111827]/10 md:w-56 lg:w-64"
                  />
                </div>
              </div>

              <div className="ml-auto flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => navigate("/admin/notifications/inbox")}
                  className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {Boolean(unreadQuery.data) && (
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                  )}
                </button>

                <button
                  onClick={() => navigate("/admin/account")}
                  className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 sm:flex"
                >
                  <Settings className="h-4.5 w-4.5" />
                </button>

                <div className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setHeaderMenuOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#111827] text-xs font-medium text-white">
                      {initialsOf(displayName)}
                    </div>
                    <div className="hidden text-left sm:block">
                      <p className="text-xs font-medium leading-tight text-slate-900">
                        {displayName}
                      </p>
                      <p className="text-[11px] leading-tight text-slate-400">
                        {displayRole}
                      </p>
                    </div>
                  </button>

                  {headerMenuOpen ? (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setHeaderMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-slate-200/70 bg-white py-1 shadow-lg">
                        <button
                          type="button"
                          onClick={handleGoToAccountSettings}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                        >
                          <Settings className="h-3.5 w-3.5" /> Settings
                        </button>
                        {canSwitchAccount && (
                          <button
                            type="button"
                            onClick={handleSwitchToUserView}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                          >
                            <ArrowLeftRight className="h-3.5 w-3.5" /> Switch to
                            user view
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setHeaderMenuOpen(false);
                            setShowLogoutModal(true);
                          }}
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

          <div className="min-w-0 p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative flex h-full w-[min(20rem,86vw)] flex-col border-r border-slate-100 bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close admin navigation"
            >
              <X className="h-4 w-4" />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      ) : null}

      {showLogoutModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xl">
            <p className="text-lg font-semibold text-slate-900">Sign out?</p>
            <p className="mt-2 text-sm text-slate-600">
              Your session will end and you’ll be redirected to the login page.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoggingOut ? "Signing out..." : "Yes, sign out"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Blocks the panel while the /setup bootstrap account still has its
          default credentials — renders null for everyone else. */}
      <DefaultCredentialsModal />
    </div>
  );
};

export default Layout;
