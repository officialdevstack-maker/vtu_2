import { Shield, Smartphone, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

const features = [
  { icon: Shield, text: "Protected access for every wallet action" },
  { icon: Zap, text: "Fast top-ups, bills, and transfers" },
  { icon: Smartphone, text: "A calm account experience on any device" },
];

const stats: [string, string][] = [
  ["24/7", "Access"],
  ["4-digit", "PIN security"],
  ["KORA", "Fintech"],
];

function BrandPanel() {
  return (
    <aside className="hidden lg:flex lg:w-[440px] shrink-0 flex-col justify-between border-r border-white/70 bg-white/55 p-12 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl border border-slate-200 bg-white/80 flex items-center justify-center shadow-sm">
          <Zap className="w-5 h-5 text-indigo-600" />
        </div>
        <span className="text-slate-950 font-semibold text-xl tracking-tight">KORA</span>
      </div>

      <div>
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Secure KORA access
        </div>
        <h1 className="text-4xl font-semibold text-slate-950 leading-tight mb-4 tracking-tight">
          Simple money tools,
          <br />
          quietly protected.
        </h1>
        <p className="text-slate-500 text-base leading-relaxed mb-10">
          Sign in, create your wallet, and protect transactions with a dedicated PIN before you move money.
        </p>
        <div className="flex flex-col gap-3">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-slate-600 text-sm">
              <div className="w-7 h-7 rounded-lg border border-slate-200 bg-white/70 flex items-center justify-center shrink-0 shadow-sm">
                <Icon className="w-3.5 h-3.5" />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(([value, label]) => (
          <div key={label} className="rounded-lg border border-white/70 bg-white/55 p-4 text-center shadow-sm backdrop-blur">
            <div className="text-slate-950 font-semibold text-lg">{value}</div>
            <div className="text-slate-400 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function MobileLogo() {
  return (
    <RouterLink to="/" className="lg:hidden flex items-center gap-2 mb-8">
      <div className="w-8 h-8 rounded-lg border border-slate-200 bg-white/80 flex items-center justify-center shadow-sm">
        <Zap className="w-4 h-4 text-indigo-600" />
      </div>
      <span className="font-semibold text-slate-900">KORA</span>
    </RouterLink>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#f6f6f4] text-slate-900">
      <BrandPanel />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-sm sm:max-w-md">
          <MobileLogo />
          {children}
        </div>
      </main>
    </div>
  );
}
