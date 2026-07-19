import { Apple, CheckCircle2, Lock, Phone, Shield, Smartphone, Wifi, Zap } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useBranding } from "@/shared/branding";

const features = [
  { icon: Shield, title: "Bank-grade security", text: "Every transaction is protected end-to-end." },
  { icon: Zap, title: "Instant delivery", text: "Airtime and data land in seconds, day or night." },
  { icon: Lock, title: "PIN-protected", text: "A dedicated PIN guards every wallet action." },
  { icon: Smartphone, title: "Any device", text: "A calm, consistent experience everywhere." },
];

// AuthLayout is now edge-to-edge (no floating card on a colored backdrop).
// Pages render their content directly on the left panel, so Card is kept
// only for structural compatibility and stripped of all visual chrome.
export const authCardCls = "rounded-none border-0 bg-transparent p-0 shadow-none";

export const authInputCls =
  "brand-primary-focus rounded-2xl border border-slate-200 bg-slate-50 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus:bg-white transition-colors";

export function AuthField({
  label,
  icon,
  error,
  action,
  className = "",
  ...inputProps
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ReactNode;
  error?: string;
  action?: ReactNode;
}) {
  return (
    <div className={className}>
      <fieldset className={`group min-w-0 rounded-2xl border bg-slate-50/80 px-3 pb-1.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.025)] transition-all duration-200 focus-within:border-orange-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-500/[0.07] ${error ? "border-red-300" : "border-slate-200 hover:border-slate-300"}`}>
        <legend className="ml-1 px-1.5 text-[11px] font-medium tracking-wide text-slate-400 transition-colors group-focus-within:text-orange-600">
          {label}
        </legend>
        <div className="flex min-h-10 items-center gap-3">
          <span className="shrink-0 text-slate-400 transition-colors group-focus-within:text-slate-700">{icon}</span>
          <input
            {...inputProps}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-300 focus:ring-0"
          />
          {action}
        </div>
      </fieldset>
      {error && <p className="mt-1.5 px-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.96 11.96 0 000 12c0 1.94.46 3.77 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

export function SocialLoginRow({ onClick, loading, label = "Continue" }: { onClick: () => void; loading?: boolean; label?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-5">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:opacity-60"
      >
        <GoogleIcon /> {label} with Google
      </button>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:opacity-60"
      >
        <Apple className="w-4 h-4 fill-current" /> {label} with Apple
      </button>
    </div>
  );
}

function GlassCard({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-white/70 bg-white/70 backdrop-blur-xl shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition-transform duration-300 ease-out hover:-translate-y-1 ${className}`}
    >
      {children}
    </div>
  );
}

// Illustrative product showcase: three glass mockup cards (airtime, data,
// wallet balance) collaged with soft rotation/offset, deliberately abstract
// rather than a literal screenshot. Reuses the app's real colors so it reads
// as "the same product".
function ShowcaseMockups() {
  return (
    <div className="relative h-[300px]">
      <GlassCard className="absolute left-0 top-4 w-[54%] min-w-[168px] -rotate-6 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111827]/10">
            <Phone className="h-4 w-4 text-[#111827]" />
          </div>
          <span className="text-xs font-medium text-slate-500">Airtime</span>
        </div>
        <p className="text-sm font-semibold text-slate-900">MTN - NGN 2,000</p>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
          <CheckCircle2 className="h-3 w-3" /> Successful
        </div>
      </GlassCard>

      <GlassCard className="absolute right-0 top-0 w-[54%] min-w-[168px] rotate-6 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111827]/10">
            <Wifi className="h-4 w-4 text-[#111827]" />
          </div>
          <span className="text-xs font-medium text-slate-500">Data bundle</span>
        </div>
        <p className="text-sm font-semibold text-slate-900">2GB - 30 days</p>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
          <CheckCircle2 className="h-3 w-3" /> Successful
        </div>
      </GlassCard>

      <GlassCard className="absolute inset-x-6 bottom-0 p-5">
        <p className="mb-1 text-xs text-slate-500">Available balance</p>
        <p className="text-2xl font-bold tabular-nums text-slate-900">NGN 128,400.00</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span>
            Deposits <span className="font-semibold text-slate-900">NGN 42,000</span>
          </span>
          <span>
            Purchases <span className="font-semibold text-slate-900">NGN 17,250</span>
          </span>
        </div>
      </GlassCard>
    </div>
  );
}

function ShowcasePanel() {
  return (
    <aside className="hidden shrink-0 border-l border-slate-100 bg-[#f8f8fb] px-10 py-16 md:flex md:w-[38%] md:flex-col md:justify-center md:gap-10 lg:w-[54%] lg:px-16 xl:px-20">
      <div className="max-w-md animate-auth-fade-in">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700">
          <Shield className="h-3.5 w-3.5" /> Secure payments, made simple
        </div>
        <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 lg:text-4xl">
          Your everyday payments, beautifully simple.
        </h2>
        <p className="text-base leading-relaxed text-slate-500">
          Top up airtime, buy data, and move money - all protected behind a dedicated transaction PIN.
        </p>
      </div>

      <div className="max-w-md animate-auth-fade-in [animation-delay:120ms]">
        <ShowcaseMockups />
      </div>

      <div className="grid max-w-md grid-cols-2 gap-x-6 gap-y-5 animate-auth-fade-in [animation-delay:220ms]">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111827]/10">
              <Icon className="h-4 w-4 text-[#111827]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  const { app_name, logo } = useBranding();

  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.055),transparent_30%),#fff]">
      <div className="flex w-full flex-col items-center justify-center px-5 py-8 sm:px-10 sm:py-12 md:w-[62%] md:px-12 lg:w-[46%] lg:px-14 xl:px-20">
        <div className="w-full max-w-lg animate-auth-fade-in">
          <RouterLink to="/" className="mb-8 flex min-w-0 items-center gap-2.5 sm:mb-10">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white overflow-hidden shrink-0 ring-1 ring-slate-200/70">
              {logo ? (
                <img src={logo} alt={app_name} className="h-full w-full object-contain" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#111827]">
                  <path d="M13 2 3 14h7l-1 8 11-14h-8l1-6z" />
                </svg>
              )}
            </div>
            <span className="min-w-0 truncate text-xl font-bold tracking-tight text-slate-900">{app_name}</span>
          </RouterLink>

          {children}
        </div>
      </div>

      <ShowcasePanel />
    </div>
  );
}
