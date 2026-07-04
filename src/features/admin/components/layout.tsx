import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BellRing,
  BookOpenCheck,
  Cable,
  ChevronRight,
  LayoutGrid,
  Megaphone,
  PlugZap,
  ReceiptText,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wallet2,
  Wifi,
} from "lucide-react";

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
          { label: "All Users", path: "/admin/customers/users" },
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
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-950 text-slate-100 lg:sticky lg:top-0 lg:h-screen lg:flex">
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
                            className={({ isActive: linkActive }) =>
                              `flex flex-1 items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                                linkActive || active
                                  ? "bg-white/10 text-white"
                                  : "text-slate-300 hover:bg-white/5 hover:text-white"
                              }`
                            }
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1 truncate">
                              {item.label}
                            </span>
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
            <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-200">
                CO
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  Chukwuemeka Obi
                </p>
                <p className="truncate text-xs text-slate-400">Super admin</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <header className="border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                  Management
                </p>
                <h1 className="text-lg font-semibold text-slate-900">
                  Admin control panel
                </h1>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                Super admin access
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
