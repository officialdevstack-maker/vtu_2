import { NavLink } from "react-router-dom";
import { Phone, Wifi, Tv, Plug, Banknote, type LucideIcon } from "lucide-react";

export type ServiceTab = {
  path: string;
  label: string;
  // Compact label for the horizontal tab strip, where space is tight.
  short: string;
  icon: LucideIcon;
  description: string;
  // Tailwind classes for the icon chip (bg + text colour).
  accent: string;
};

// Single source of truth for the services under the "Services" section —
// consumed by the horizontal ServiceTabs strip, the /services hub grid, and
// the mobile services bottom sheet, so they never drift out of sync.
export const serviceTabs: ServiceTab[] = [
  {
    path: "/buy-airtime",
    label: "Airtime",
    short: "Airtime",
    icon: Phone,
    description: "Top up any network",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    path: "/buy-data",
    label: "Data",
    short: "Data",
    icon: Wifi,
    description: "Bundles for all networks",
    accent: "bg-indigo-50 text-indigo-600",
  },
  {
    path: "/cable-tv",
    label: "Cable TV",
    short: "Cable",
    icon: Tv,
    description: "DSTV, GOtv, Startimes",
    accent: "bg-violet-50 text-violet-600",
  },
  {
    path: "/electricity",
    label: "Electricity",
    short: "Power",
    icon: Plug,
    description: "All DISCOs supported",
    accent: "bg-amber-50 text-amber-600",
  },
  {
    path: "/airtime-to-cash",
    label: "Airtime to Cash",
    short: "Airtime cash",
    icon: Banknote,
    description: "Convert airtime to naira",
    accent: "bg-emerald-50 text-emerald-600",
  },
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
            {tab.short}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
