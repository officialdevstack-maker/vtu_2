import { NavLink } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { PageHeader, Card } from "../components/shared-ui";
import { useBranding } from "@/shared/branding";
import { serviceTabs } from "../components/service-tabs";

// Services hub. On mobile the same services are reachable straight from the
// bottom-nav "Services" sheet (MobileServicesSheet); this page is the fuller
// grid used on wider screens and as the /services landing. Every card links to
// the real service page — no mock purchase flow.
export default function ServicesPage() {
  const { app_name } = useBranding();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <PageHeader
        title="Services"
        description={`Everything you can pay for on ${app_name}`}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {serviceTabs.map((s) => (
          <NavLink key={s.path} to={s.path} className="group block">
            <Card className="flex items-center gap-3 p-4 transition-colors group-hover:border-[#111827]/30 group-hover:bg-[#111827]/[0.03]">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.accent}`}
              >
                <s.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{s.label}</p>
                <p className="truncate text-xs text-slate-400">{s.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5" />
            </Card>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
