import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { useBranding } from "@/shared/branding";
import { Button } from "./ui";

const navLinks = [
  { label: "Features", href: "#services" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#why-kora" },
  { label: "Support", href: "#faq" },
];

function BrandMark() {
  const { app_name, logo } = useBranding();
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2">
      <div className="brand-primary-bg flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl shadow-premium-sm">
        {logo ? (
          <img src={logo} alt={app_name} className="h-full w-full object-contain" />
        ) : (
          <Zap className="h-4 w-4 text-white" />
        )}
      </div>
      <span className="text-[15px] font-semibold tracking-tight text-slate-900">{app_name}</span>
    </Link>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const barOpacity = useTransform(scrollY, [0, 80], [0.7, 0.92]);
  const barShadow = useTransform(
    scrollY,
    [0, 80],
    ["0 8px 30px -18px rgba(15,23,42,0.08)", "0 16px 40px -16px rgba(15,23,42,0.16)"],
  );

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <motion.nav
        aria-label="Primary"
        style={{ opacity: barOpacity, boxShadow: barShadow }}
        className="flex w-full max-w-4xl items-center justify-between gap-4 rounded-full border border-slate-900/[0.06] bg-white/70 px-4 py-2.5 backdrop-blur-2xl sm:px-5"
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
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
