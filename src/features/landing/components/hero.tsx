import { lazy, Suspense, useEffect, useState } from "react";
import { ShieldCheck, Star, Zap } from "lucide-react";
import { useBranding } from "@/shared/branding";
import { Button, Kicker } from "./ui";

const HeroScene = lazy(() =>
  import("./hero-scene").then((module) => ({ default: module.HeroScene })),
);

const trustIndicators = [
  { icon: ShieldCheck, label: "Bank-level encryption" },
  { icon: Star, label: "4.9/5 from 12,000+ reviews" },
  { icon: Zap, label: "Most payments in under 10s" },
];

export function Hero() {
  const { app_name } = useBranding();
  const [showScene, setShowScene] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowScene(true), 150);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <section className="relative overflow-hidden pb-20 pt-36 sm:pt-40 lg:pb-28 lg:pt-48">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-4 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="max-w-xl">
          <div>
            <Kicker>Trusted by 150,000+ customers across Nigeria</Kicker>
          </div>

          <h1
            className="text-balance mt-6 text-[2.75rem] font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]"
          >
            Bills, paid at the
            <br />
            speed of <span className="brand-primary-text">thought.</span>
          </h1>

          <p
            className="mt-6 max-w-md text-[17px] leading-relaxed text-slate-500"
          >
            {app_name} is a single, secure wallet for airtime, data, cable TV and electricity —
            built to settle automatically and feel instant every time.
          </p>

          <div
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button to="/register" size="lg">
              Create free account
            </Button>
            <Button href="#showcase" variant="ghost" size="lg">
              See it in action
            </Button>
          </div>

          <dl
            className="mt-11 flex flex-wrap gap-x-7 gap-y-3"
          >
            {trustIndicators.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className="brand-primary-text h-4 w-4 shrink-0" strokeWidth={1.75} />
                <dt className="sr-only">Trust indicator</dt>
                <dd className="text-[13px] font-medium text-slate-500">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="min-h-[420px] lg:min-h-[520px]">
          {showScene ? (
            <Suspense fallback={null}>
              <HeroScene />
            </Suspense>
          ) : null}
        </div>
      </div>
    </section>
  );
}
