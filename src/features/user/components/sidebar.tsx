import {
  LayoutDashboard, Bell, Settings, User, LogOut, Receipt,
  Wallet, HelpCircle, Share2, Users, Phone, Wifi, Tv, Plug,
  CreditCard, Zap, BarChart3,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

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
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { id: "wallet", label: "Fund wallet", icon: Wallet, path: "/wallet" },
      { id: "transactions", label: "Transactions", icon: Receipt, path: "/transactions" },
    ],
  },
  {
    label: "Services",
    items: [
      { id: "buy-airtime", label: "Buy airtime", icon: Phone, path: "/buy-airtime" },
      { id: "buy-data", label: "Buy data", icon: Wifi, path: "/buy-data" },
      { id: "cable-tv", label: "Cable TV", icon: Tv, path: "/cable-tv" },
      { id: "electricity", label: "Electricity", icon: Plug, path: "/electricity" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "pricing", label: "Pricing", icon: CreditCard, path: "/pricing" },
      { id: "referral", label: "Referral", icon: Share2, path: "/referral" },
      { id: "beneficiaries", label: "Beneficiaries", icon: Users, path: "/beneficiaries" },
      { id: "notifications", label: "Notifications", icon: Bell, path: "/notifications", badge: 3 },
      { id: "support", label: "Support", icon: HelpCircle, path: "/support" },
      { id: "admin", label: "Admin", icon: BarChart3, path: "/admin" },
    ],
  },
];

const bottomItems: NavItem[] = [
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col transition-transform duration-200 shrink-0 bg-gray-900 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">KORA</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 overflow-y-auto space-y-4">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="text-[11px] font-medium tracking-wide text-white/35 mb-1.5 px-2.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.id}
                      onClick={() => go(item.path)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-white/10 text-white font-medium"
                          : "text-white/60 hover:bg-white/5 hover:text-white/90"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {"badge" in item && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-medium shrink-0">
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
        <div className="px-2.5 pb-2 border-t border-white/10 pt-2">
          <div className="space-y-0.5 mb-2">
            {bottomItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.path)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                    active ? "bg-white/10 text-white font-medium" : "text-white/60 hover:bg-white/5 hover:text-white/90"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          {/* User footer */}
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors group">
            <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0">
              CO
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate leading-tight">Chukwuemeka</p>
              <p className="text-[11px] truncate text-white/40">emeka.obi@gmail.com</p>
            </div>
            <LogOut className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
