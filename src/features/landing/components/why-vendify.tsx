import { ShieldCheck, Zap, MapPinned, PercentCircle } from "lucide-react";
import { useBranding } from "@/shared/branding";
import { SectionHeading } from "./ui";
import { Reveal } from "./motion";

const reasons = [
  {
    icon: ShieldCheck,
    title: "Secure by design",
    description: "Bank-level encryption and a dedicated virtual account for every wallet, monitored around the clock.",
    offset: false,
  },
  {
    icon: Zap,
    title: "Instant delivery",
    description: "Transactions settle automatically — most complete in under 10 seconds, with automatic retries on failure.",
    offset: true,
  },
  {
    icon: MapPinned,
    title: "Built for Nigeria",
    description: "Every network, every major disco, and local payment rails — not a generic global template.",
    offset: false,
  },
  {
    icon: PercentCircle,
    title: "Transparent pricing",
    description: "Zero transaction fees and up to 5% off airtime — the price you see is the price you pay.",
    offset: true,
  },
];

export function WhyVendify() {
  const { app_name } = useBranding();

  return (
    <section id="why-vendify" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <SectionHeading
            kicker={`Why ${app_name}`}
            title="Built to feel inevitable, not impressive"
            description="No gimmicks — just a payment experience that gets out of your way."
          />
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2">
          {reasons.map((reason, i) => (
            <Reveal key={reason.title} delay={i * 0.06} className={reason.offset ? "md:mt-12" : undefined}>
              <div className="glass shadow-premium-sm relative overflow-hidden rounded-[28px] p-7">
                <reason.icon
                  className="absolute -right-3 -top-3 h-24 w-24 text-slate-900/[0.03]"
                  strokeWidth={1}
                />
                <span className="brand-primary-soft brand-primary-text relative flex h-11 w-11 items-center justify-center rounded-2xl">
                  <reason.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="relative mt-5 text-lg font-semibold text-slate-900">{reason.title}</h3>
                <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                  {reason.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
