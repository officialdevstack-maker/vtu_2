import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BellRing,
  BookOpenCheck,
  Cable,
  ChevronRight,
  LayoutGrid,
  Menu,
  Megaphone,
  PlugZap,
  ReceiptText,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wallet2,
  Wifi,
  X,
} from "lucide-react";
import { useAuth } from "../../../shared/providers/auth";

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
    items: [{ label: "Dashboard", path: "/admin", icon: LayoutGrid }],
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
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Service Control",
        path: "/admin/service-control",
        icon: Sparkles,
      },
      {
        label: "Customers",
        path: "/admin/customers",
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
          { label: "Campaign / Event", path: "/admin/growth/campaigns" },
          { label: "Promo / Discount", path: "/admin/growth/promos" },
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
        path: "/admin/notifications",
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
  const { logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (path: string) => {
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
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Admin Center</p>
            <p className="text-xs text-slate-400">Operations control</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                const hasActiveChild =
                  item.children?.some((child) => isActive(child.path)) ??
                  false;
                const isExpanded =
                  expandedItems.includes(item.path) || hasActiveChild;

                return (
                  <div key={item.path}>
                    <div className="flex items-center rounded-lg">
                      <NavLink
                        to={item.path}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={({ isActive: linkActive }) =>
                          `flex flex-1 items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                            linkActive || active
                              ? "bg-white/10 text-white"
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
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
                          className="rounded-r-lg px-2 py-2.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
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
                      <div className="ml-7 mt-1 space-y-1 border-l border-white/10 pl-3">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={() => setMobileSidebarOpen(false)}
                            className={({ isActive: childActive }) =>
                              `flex items-center rounded-md px-2 py-1.5 text-sm transition-colors ${
                                childActive
                                  ? "text-white"
                                  : "text-slate-400 hover:text-slate-200"
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

      <div className="border-t border-white/10 px-3 py-3">
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="flex w-full items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left transition-colors hover:bg-white/10"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-200">
            CO
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              Chukwuemeka Obi
            </p>
            <p className="truncate text-xs text-slate-400">Super admin</p>
          </div>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-app-bg text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-gray-900 text-slate-100 shadow-2xl lg:sticky lg:top-0 lg:h-screen lg:flex">
          {renderSidebarContent()}
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 h-14 border-b border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="flex h-full items-center gap-2 px-3 sm:px-4 lg:px-6">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="rounded-md p-2 text-slate-500 transition-colors hover:bg-gray-100 hover:text-slate-700 lg:hidden"
                aria-label="Open admin navigation"
                aria-expanded={mobileSidebarOpen}
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-600">
                    Management
                  </p>
                  <h1 className="truncate text-sm font-semibold text-slate-900">
                    Admin control panel
                  </h1>
                </div>

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
                <button className="relative rounded-md p-2 text-slate-500 transition-colors hover:bg-gray-100 hover:text-slate-700">
                  <Bell className="h-4.5 w-4.5" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                </button>

                <button className="hidden rounded-md p-2 text-slate-500 transition-colors hover:bg-gray-100 hover:text-slate-700 sm:flex">
                  <Settings className="h-4.5 w-4.5" />
                </button>

                <div className="mx-1 hidden h-5 w-px bg-gray-200 sm:block" />

                <button className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-gray-100">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">
                    CO
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs font-medium leading-tight text-slate-900">
                      Chukwuemeka Obi
                    </p>
                    <p className="text-[11px] leading-tight text-slate-400">
                      Super admin
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6">
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
          <aside className="relative flex h-full w-[min(20rem,86vw)] flex-col border-r border-white/10 bg-gray-900 text-slate-100 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-md p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close admin navigation"
            >
              <X className="h-4 w-4" />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      ) : null}

      {showLogoutModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 shadow-2xl">
            <p className="text-lg font-semibold text-slate-900">Sign out?</p>
            <p className="mt-2 text-sm text-slate-600">
              Your session will end and you’ll be redirected to the login page.
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
    </div>
  );
};

export default Layout;
