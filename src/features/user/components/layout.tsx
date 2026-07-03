import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import {
  LayoutDashboard, Zap, Receipt, Wallet, User,
} from "lucide-react";
import { useLocation } from "react-router-dom";

const mobileNavItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { path: "/buy-airtime", icon: Zap, label: "Services" },
  { path: "/transactions", icon: Receipt, label: "History" },
  { path: "/wallet", icon: Wallet, label: "Wallet" },
  { path: "/profile", icon: User, label: "Profile" },
];

const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 flex">
        {mobileNavItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors ${
                active ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default UserLayout;
