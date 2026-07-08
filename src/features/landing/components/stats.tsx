import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Reveal } from "./motion";
import { GlowOrb } from "./ui";

const stats = [
  { value: 150000, prefix: "", suffix: "+", label: "Active customers" },
  { value: 2, prefix: "₦", suffix: "B+", label: "Processed to date" },
  { value: 99.9, prefix: "", suffix: "%", label: "Platform uptime", decimals: 1 },
  { value: 10, prefix: "<", suffix: "s", label: "Average delivery time" },
];

function Counter({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-NG"),
  );

  useEffect(() => {
    if (!isInView) return;
    if (reduceMotion) {
      motionVal.set(value);
      return;
    }
    const controls = animate(motionVal, value, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [isInView, reduceMotion, motionVal, value]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

export function Stats() {
  return (
    <section className="relative overflow-hidden bg-[#0b0b12] py-24 sm:py-28">
      <GlowOrb className="landing-brand-glow left-1/4 top-0 h-[420px] w-[420px] opacity-80" />
      <GlowOrb className="landing-brand-glow right-1/4 bottom-0 h-[420px] w-[420px] opacity-70" />
      <div className="noise-layer" />

      <div className="relative mx-auto max-w-6xl px-4">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
            By the numbers
          </p>
          <h2 className="text-balance mx-auto mt-3 max-w-xl text-center text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            Trusted at a scale that speaks for itself
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08} className="glass-dark rounded-3xl px-5 py-8 text-center">
              <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {stat.prefix}
                <Counter value={stat.value} decimals={stat.decimals} />
                {stat.suffix}
              </p>
              <p className="mt-2 text-[13px] font-medium text-slate-400">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
