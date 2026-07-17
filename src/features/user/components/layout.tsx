import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import { WelcomeMessageGate } from "./welcome-message-gate";
import { MobileServicesSheet } from "./mobile-services-sheet";
import { ImpersonationBanner } from "@/shared/components/impersonation-banner";
import { LayoutDashboard, Zap, Receipt, Wallet, Settings } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/shared/providers/auth";
import { notificationService } from "@/shared/notificationService";

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
  const [servicesSheetOpen, setServicesSheetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  // One query observer for the entire customer shell prevents the topbar and
  // sidebar from creating competing unread-count pollers after login.
  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: ({ signal }) => notificationService.getUnreadCount(signal),
    enabled: Boolean(user),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
  const unreadCount = unreadQuery.data ?? 0;

  useEffect(() => {
    // Route changes are the external event that dismisses transient mobile UI.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarOpen(false);
    setServicesSheetOpen(false);
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
    <div className="user-app flex h-dvh min-h-0 max-w-full overflow-hidden bg-app-bg">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleCollapsed}
        unreadCount={unreadCount}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ImpersonationBanner />
        <Topbar
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          unreadCount={unreadCount}
        />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="user-page-container">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="user-bottom-nav fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden">
        {mobileNavItems.map((item) => {
          const isServices = item.path === "/services";
          const active = isServices
            ? servicesSheetOpen || servicePaths.has(location.pathname)
            : location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() =>
                isServices
                  ? setServicesSheetOpen((o) => !o)
                  : navigate(item.path)
              }
              aria-expanded={isServices ? servicesSheetOpen : undefined}
              className={`flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[10px] transition-colors min-[360px]:text-[11px] ${
                active
                  ? "font-medium text-[#111827]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="max-w-full leading-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <MobileServicesSheet
        open={servicesSheetOpen}
        onClose={() => setServicesSheetOpen(false)}
      />

      <WelcomeMessageGate />
    </div>
  );
};

export default UserLayout;
