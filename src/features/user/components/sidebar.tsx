import {
  LayoutDashboard, Bell, Settings, User, LogOut, Receipt,
  Wallet, HelpCircle, Share2, Users, Phone, Wifi, Tv, Plug,
  CreditCard, Zap,
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
    label: "MAIN",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { id: "wallet", label: "Fund Wallet", icon: Wallet, path: "/wallet" },
      { id: "transactions", label: "Transactions", icon: Receipt, path: "/transactions" },
    ],
  },
  {
    label: "SERVICES",
    items: [
      { id: "buy-airtime", label: "Buy Airtime", icon: Phone, path: "/buy-airtime" },
      { id: "buy-data", label: "Buy Data", icon: Wifi, path: "/buy-data" },
      { id: "cable-tv", label: "Cable TV", icon: Tv, path: "/cable-tv" },
      { id: "electricity", label: "Electricity", icon: Plug, path: "/electricity" },
    ],
  },
  {
    label: "EXPLORE",
    items: [
      { id: "pricing", label: "Pricing", icon: CreditCard, path: "/pricing" },
      { id: "referral", label: "Referral", icon: Share2, path: "/referral" },
      { id: "beneficiaries", label: "Beneficiaries", icon: Users, path: "/beneficiaries" },
      { id: "notifications", label: "Notifications", icon: Bell, path: "/notifications", badge: 3 },
      { id: "support", label: "Support", icon: HelpCircle, path: "/support" },
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
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-200 shrink-0 bg-indigo-950 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base tracking-tight leading-tight">KORA</p>
              <p className="text-indigo-300 text-xs font-medium">VTU Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="text-xs font-bold tracking-widest mb-2 px-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.id}
                      onClick={() => go(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        active
                          ? "bg-white text-indigo-700 shadow-md"
                          : "text-white/65 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-indigo-600" : ""}`} />
                      <span>{item.label}</span>
                      {"badge" in item && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
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
        <div className="px-3 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="pt-2 space-y-0.5 mb-2">
            {bottomItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active ? "bg-white text-indigo-700 shadow-md" : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          {/* User footer */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/10 transition-all group">
            <div className="w-8 h-8 bg-indigo-400 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
              CO
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">Chukwuemeka</p>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>emeka.obi@gmail.com</p>
            </div>
            <LogOut className="w-4 h-4 text-white/30 group-hover:text-white/60 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
