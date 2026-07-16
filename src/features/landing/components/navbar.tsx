import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Zap } from "lucide-react";
import { useBranding } from "@/shared/branding";
import { Button } from "./ui";

const navLinks = [
  { label: "Features", href: "/#services" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/#why-vendify" },
  { label: "Support", href: "/#faq" },
];

function BrandMark() {
  const { app_name, logo } = useBranding();
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-white shadow-premium-sm ring-1 ring-slate-200/70">
        {logo ? (
          <img src={logo} alt={app_name} className="h-full w-full object-contain" />
        ) : (
          <Zap className="h-4 w-4 text-[#111827]" />
        )}
      </div>
      <span className="text-[15px] font-semibold tracking-tight text-slate-900">{app_name}</span>
    </Link>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        aria-label="Primary"
        className="flex w-full max-w-4xl items-center justify-between gap-4 rounded-full border border-slate-900/[0.06] bg-white/90 px-4 py-2.5 shadow-[0_12px_36px_-18px_rgba(15,23,42,0.16)] backdrop-blur-2xl sm:px-5"
      >
        <BrandMark />

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-900/[0.04] hover:text-slate-900"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/login"
            className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Sign in
          </Link>
          <Button to="/register" size="md">
            Create account
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-900/[0.05] md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
          <div
            className="glass-strong shadow-premium absolute inset-x-4 top-[calc(100%+0.5rem)] rounded-3xl p-3 md:hidden"
          >
            <ul className="flex flex-col">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-2xl px-4 py-3 text-[15px] font-medium text-slate-700 transition-colors hover:bg-slate-900/[0.04]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-900/[0.06] p-2 pt-4">
              <Button to="/login" variant="ghost" className="w-full justify-center">
                Sign in
              </Button>
              <Button to="/register" className="w-full justify-center">
                Create account
              </Button>
            </div>
          </div>
      )}
    </header>
  );
}
