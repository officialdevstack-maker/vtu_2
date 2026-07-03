<<<<<<< HEAD
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../../shared/components/sidebar";
import { Box } from "@mui/material";
import Topbar from "../../../shared/components/topbar";
=======
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

const SIDEBAR_COLLAPSED_KEY = "kora-sidebar-collapsed";
>>>>>>> bc44dfcd405678cf589df1fe65d1a22756f88065

const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1"
  );
  const location = useLocation();
  const navigate = useNavigate();

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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 pb-20 lg:pb-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 flex">
        {mobileNavItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                active ? "text-indigo-600 font-medium" : "text-slate-400 hover:text-slate-600"
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
