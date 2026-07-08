import { PercentCircle, Timer, Receipt, ArrowRight } from "lucide-react";
import { SectionHeading, GlowOrb, Button } from "./ui";
import { Reveal, StaggerGroup, StaggerItem } from "./motion";

const highlights = [
  { icon: PercentCircle, value: "Zero", label: "Transaction fees on every payment" },
  { icon: Timer, value: "3–5%", label: "Discount on airtime purchases" },
  { icon: Receipt, value: "Instant", label: "Delivery, with automatic retries" },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <SectionHeading
            kicker="Pricing"
            title="No subscriptions. No hidden charges."
            description="Create your account for free — you only ever pay for what you send, and the price is shown before you confirm."
            align="center"
          />
        </Reveal>

        <Reveal delay={0.1} className="relative mt-14 overflow-hidden rounded-[32px]">
          <div className="glass-strong shadow-premium relative p-8 sm:p-10">
            <GlowOrb className="landing-brand-glow right-0 top-0 h-72 w-72 opacity-60" />
            <StaggerGroup className="relative grid grid-cols-1 gap-8 sm:grid-cols-3 sm:divide-x sm:divide-slate-900/[0.06]">
              {highlights.map((h) => (
                <StaggerItem key={h.label} className="text-center sm:px-6">
                  <span className="brand-primary-soft brand-primary-text mx-auto flex h-11 w-11 items-center justify-center rounded-2xl">
                    <h.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{h.value}</p>
                  <p className="mt-1.5 text-sm text-slate-500">{h.label}</p>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </Reveal>

        <Reveal delay={0.2} className="mt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-slate-500">Want the full fee breakdown per network and biller?</p>
          <Button to="/pricing" variant="ghost">
            View full pricing <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
