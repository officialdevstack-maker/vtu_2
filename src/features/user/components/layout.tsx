import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { WelcomeMessageGate } from "./welcome-message-gate";
import { ImpersonationBanner } from "@/shared/components/impersonation-banner";
import { LayoutDashboard, Zap, Receipt, Wallet, Settings } from "lucide-react";
import { useLocation } from "react-router-dom";

const mobileNavItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { path: "/services", icon: Zap, label: "Services" },
  { path: "/transactions", icon: Receipt, label: "History" },
  { path: "/wallet", icon: Wallet, label: "Wallet" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const servicePaths = new Set([
  "/services",
  "/buy-airtime",
  "/buy-data",
  "/cable-tv",
  "/electricity",
  "/airtime-to-cash",
]);

const SIDEBAR_COLLAPSED_KEY = "vendify-sidebar-collapsed";

const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1",
  );
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ImpersonationBanner />
        <Topbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-7xl flex-col px-3 py-3 pb-24 sm:px-4 sm:py-4 lg:px-6 lg:py-6 lg:pb-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden">
        {mobileNavItems.map((item) => {
          const active =
            location.pathname === item.path ||
            (item.path === "/services" && servicePaths.has(location.pathname));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-1 min-w-0 flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] transition-colors ${
                active
                  ? "font-medium text-[#111827]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <WelcomeMessageGate />
    </div>
  );
};

export default UserLayout;
