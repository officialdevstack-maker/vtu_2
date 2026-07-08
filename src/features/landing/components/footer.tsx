import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { useBranding } from "@/shared/branding";
import { Reveal } from "./motion";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "Create account", to: "/register" },
      { label: "Sign in", to: "/login" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#why-kora" },
      { label: "How it works", href: "#showcase" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of service", href: "#" },
      { label: "Privacy policy", href: "#" },
    ],
  },
];

export function Footer() {
  const { app_name, logo } = useBranding();

  return (
    <footer className="relative border-t border-slate-900/[0.06] pb-8 pt-16 sm:pt-20">
      <Reveal className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="brand-primary-bg flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl shadow-premium-sm">
                {logo ? (
                  <img src={logo} alt={app_name} className="h-full w-full object-contain" />
                ) : (
                  <Zap className="h-4 w-4 text-white" />
                )}
              </div>
              <span className="text-sm font-semibold text-slate-900">{app_name}</span>
            </Link>
            <p className="mt-4 max-w-[200px] text-[13px] leading-relaxed text-slate-400">
              Airtime, data and bill payments for everyday Nigeria.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"to" in link && link.to ? (
                      <Link to={link.to} className="text-sm text-slate-600 transition-colors hover:text-slate-900">
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-slate-600 transition-colors hover:text-slate-900"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-900/[0.06] pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} {app_name}. All rights reserved.
          </p>
          <a href="mailto:support@kora.com" className="text-xs text-slate-400 transition-colors hover:text-slate-700">
            support@kora.com
          </a>
        </div>
      </Reveal>
    </footer>
  );
}
