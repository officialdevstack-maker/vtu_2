import { motion } from "framer-motion";
import { ShieldCheck, Star, Zap } from "lucide-react";
import { useBranding } from "@/shared/branding";
import { Button, Kicker } from "./ui";
import { HeroScene } from "./hero-scene";

const trustIndicators = [
  { icon: ShieldCheck, label: "Bank-level encryption" },
  { icon: Star, label: "4.9/5 from 12,000+ reviews" },
  { icon: Zap, label: "Most payments in under 10s" },
];

export function Hero() {
  const { app_name } = useBranding();

  return (
    <section className="relative overflow-hidden pb-20 pt-36 sm:pt-40 lg:pb-28 lg:pt-48">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-4 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Kicker>Trusted by 150,000+ customers across Nigeria</Kicker>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="text-balance mt-6 text-[2.75rem] font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]"
          >
            Bills, paid at the
            <br />
            speed of <span className="brand-primary-text">thought.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
            className="mt-6 max-w-md text-[17px] leading-relaxed text-slate-500"
          >
            {app_name} is a single, secure wallet for airtime, data, cable TV and electricity —
            built to settle automatically and feel instant every time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button to="/register" size="lg">
              Create free account
            </Button>
            <Button href="#showcase" variant="ghost" size="lg">
              See it in action
            </Button>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-11 flex flex-wrap gap-x-7 gap-y-3"
          >
            {trustIndicators.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className="brand-primary-text h-4 w-4 shrink-0" strokeWidth={1.75} />
                <dt className="sr-only">Trust indicator</dt>
                <dd className="text-[13px] font-medium text-slate-500">{item.label}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <HeroScene />
      </div>
    </section>
  );
}
