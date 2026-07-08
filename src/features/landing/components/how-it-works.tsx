import { UserPlus, Wallet, Send } from "lucide-react";
import { SectionHeading } from "./ui";
import { Reveal, StaggerGroup, StaggerItem } from "./motion";

const steps = [
  {
    icon: UserPlus,
    title: "Create an account",
    description: "Sign up with your email or phone number in under a minute.",
  },
  {
    icon: Wallet,
    title: "Fund your wallet",
    description: "Transfer from any bank, pay by card, or dial a USSD code.",
  },
  {
    icon: Send,
    title: "Pay instantly",
    description: "Buy airtime, data, or settle a bill — most complete in seconds.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <SectionHeading
            kicker="How it works"
            title="Three steps from sign-up to settled"
            align="center"
          />
        </Reveal>

        <StaggerGroup className="relative mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
          <div
            aria-hidden
            className="landing-brand-line absolute left-0 right-0 top-8 hidden h-px md:block"
          />
          {steps.map((step, i) => (
            <StaggerItem key={step.title} className="relative text-center">
              <div className="glass shadow-premium-sm relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
                <step.icon className="brand-primary-text h-6 w-6" strokeWidth={1.75} />
                <span className="brand-primary-bg absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-premium-sm">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-slate-900">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-[240px] text-sm leading-relaxed text-slate-500">
                {step.description}
              </p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
