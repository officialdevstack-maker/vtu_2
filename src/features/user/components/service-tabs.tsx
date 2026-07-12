import { NavLink } from "react-router-dom";
import { Phone, Wifi, Tv, Plug, Banknote } from "lucide-react";

const serviceTabs = [
  { path: "/buy-airtime", label: "Airtime", icon: Phone },
  { path: "/buy-data", label: "Data", icon: Wifi },
  { path: "/cable-tv", label: "Cable", icon: Tv },
  { path: "/electricity", label: "Electricity", icon: Plug },
  { path: "/airtime-to-cash", label: "Airtime cash", icon: Banknote },
];

export function ServiceTabs() {
  return (
    <div className="max-w-full overflow-x-auto rounded-lg bg-gray-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max min-w-full gap-1.5">
        {serviceTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`
            }
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
