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

// Crisp, opaque card — no blur, no translucency. A flat white surface with a
// hairline border and a soft colorless shadow for depth.
export const authCardCls =
  "rounded-3xl border border-slate-100 bg-white p-8 sm:p-10 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_24px_48px_-16px_rgba(15,23,42,0.16)]";

export const authInputCls =
  "rounded-2xl border border-slate-200 bg-slate-50 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] focus:bg-white";

function BrandPanel() {
  return (
    <aside className="hidden lg:flex lg:w-[440px] shrink-0 flex-col justify-between bg-indigo-600 px-12 py-14">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-semibold text-xl tracking-tight">KORA</span>
      </div>

      <div className="flex-1 flex flex-col justify-center py-16">
        <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          Secure KORA access
        </div>
        <h1 className="text-4xl font-bold text-white leading-tight mb-4 tracking-tight">
          Simple money tools,
          <br />
          quietly protected.
        </h1>
        <p className="text-indigo-100 text-base leading-relaxed mb-10 max-w-sm">
          Sign in, create your wallet, and protect transactions with a dedicated PIN before you move money.
        </p>
        <div className="flex flex-col gap-3">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-white text-sm font-medium">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-white" />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(([value, label]) => (
          <div key={label} className="rounded-2xl bg-white/15 p-4 text-center">
            <div className="text-white font-bold text-lg">{value}</div>
            <div className="text-indigo-100 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function MobileLogo() {
  return (
    <RouterLink to="/" className="lg:hidden flex items-center gap-2 mb-8">
      <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
        <Zap className="w-4.5 h-4.5 text-white" />
      </div>
      <span className="font-bold text-slate-900">KORA</span>
    </RouterLink>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#fafafa] text-slate-900">
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
