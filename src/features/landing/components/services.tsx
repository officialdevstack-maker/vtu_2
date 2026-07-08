import { Phone, Wifi, Tv, Zap, ArrowUpRight } from "lucide-react";
import { SectionHeading, GlowOrb } from "./ui";
import { Reveal } from "./motion";

const networks = ["MTN", "Airtel", "Glo", "9mobile"];
const billers = ["DStv", "GOtv", "Startimes"];
const discos = ["EKEDC", "IKEDC", "AEDC", "+7 more"];

export function Services() {
  return (
    <section id="services" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <SectionHeading
            kicker="Services"
            title="Everything you pay for, in one place"
            description="Four rails, one wallet — every purchase settles automatically through our provider network."
          />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[230px_230px]">
          {/* Airtime — large feature panel */}
          <Reveal delay={0.05} className="relative sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <div className="glass-strong shadow-premium relative h-full overflow-hidden rounded-[28px] p-7">
              <GlowOrb className="landing-brand-glow -right-10 -top-10 h-56 w-56 opacity-70" />
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <span className="brand-primary-bg shadow-premium-brand flex h-11 w-11 items-center justify-center rounded-2xl text-white">
                    <Phone className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">Airtime top-up</h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                    Every network, delivered instantly — set it once and never run out mid-call.
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-2">
                  {networks.map((n) => (
                    <span key={n} className="glass rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Data — wide panel */}
          <Reveal delay={0.1} className="sm:col-span-2 lg:col-span-2 lg:row-span-1">
            <div className="glass shadow-premium-sm flex h-full items-center justify-between gap-4 overflow-hidden rounded-[28px] p-6">
              <div>
                <span className="brand-primary-soft brand-primary-text flex h-10 w-10 items-center justify-center rounded-xl">
                  <Wifi className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">Data bundles</h3>
                <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500">
                  SME and gifting plans at competitive rates, on every network.
                </p>
              </div>
              <ArrowUpRight className="hidden h-5 w-5 shrink-0 text-slate-300 sm:block" />
            </div>
          </Reveal>

          {/* Cable TV — small panel */}
          <Reveal delay={0.15} className="lg:col-span-1 lg:row-span-1">
            <div className="glass shadow-premium-sm h-full rounded-[28px] p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/[0.05] text-slate-600">
                <Tv className="h-4.5 w-4.5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">Cable TV</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                Renew {billers.join(", ")} in seconds.
              </p>
            </div>
          </Reveal>

          {/* Electricity — small panel */}
          <Reveal delay={0.2} className="lg:col-span-1 lg:row-span-1">
            <div className="glass shadow-premium-sm h-full rounded-[28px] p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Zap className="h-4.5 w-4.5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">Electricity</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                Prepaid & postpaid tokens — {discos.join(", ")}.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
