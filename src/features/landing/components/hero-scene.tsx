import { useRef, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { Wifi, Phone, Zap, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Float } from "./motion";
import { GlowOrb } from "./ui";

function useParallaxLayer(mx: MotionValue<number>, my: MotionValue<number>, depth: number) {
  const x = useTransform(mx, [-1, 1], [-depth, depth]);
  const y = useTransform(my, [-1, 1], [-depth, depth]);
  return { x, y };
}

export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 20, mass: 0.6 });
  const my = useSpring(rawY, { stiffness: 60, damping: 20, mass: 0.6 });

  const back = useParallaxLayer(mx, my, 10);
  const mid = useParallaxLayer(mx, my, 20);
  const front = useParallaxLayer(mx, my, 32);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    rawX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    rawY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto h-[380px] w-full max-w-md sm:h-[440px] lg:h-[560px] lg:max-w-none"
    >
      {/* Ambient light */}
      <GlowOrb className="landing-brand-glow left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-80" />
      <GlowOrb className="landing-brand-glow right-0 top-4 h-56 w-56 opacity-70" style={{ animationDelay: "2s" }} />

      {/* Glowing halo ring behind the wallet */}
      <motion.div
        style={back}
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 sm:h-[360px] sm:w-[360px] lg:h-[420px] lg:w-[420px]"
      >
        <div
          className="landing-brand-ring h-full w-full rounded-full"
          style={{
            mask: "radial-gradient(closest-side, transparent 76%, black 78%, black 82%, transparent 84%)",
            WebkitMask: "radial-gradient(closest-side, transparent 76%, black 78%, black 82%, transparent 84%)",
          }}
        />
      </motion.div>

      {/* Primary wallet card */}
      <motion.div
        style={mid}
        initial={{ opacity: 0, y: 40, rotate: -8 }}
        animate={{ opacity: 1, y: 0, rotate: -6 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="absolute left-1/2 top-1/2 w-[240px] -translate-x-1/2 -translate-y-1/2 sm:w-[270px] lg:w-[300px]"
      >
        <Float duration={7.5} distance={12}>
          <div className="glass-strong shadow-premium-brand rounded-[28px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Wallet balance</span>
              <div className="brand-primary-bg flex h-7 w-7 items-center justify-center rounded-full">
                <ArrowUpRight className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <p className="mt-3 text-[28px] font-semibold tracking-tight text-slate-900 sm:text-3xl">₦128,450</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="brand-primary-bg h-1.5 flex-1 rounded-full" />
              <span className="text-[11px] font-medium text-emerald-600">+12.4%</span>
            </div>
          </div>
        </Float>
      </motion.div>

      {/* Floating data chip */}
      <motion.div
        style={front}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        className="absolute right-0 top-2 hidden sm:block lg:right-4 lg:top-6"
      >
        <Float duration={6} distance={16} delay={0.4} rotate={7}>
          <div className="glass shadow-premium-sm flex items-center gap-2.5 rounded-2xl px-4 py-3">
            <div className="brand-primary-soft brand-primary-text flex h-8 w-8 items-center justify-center rounded-xl">
              <Wifi className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-900">2.5GB delivered</p>
              <p className="text-[11px] text-slate-400">MTN SME data</p>
            </div>
          </div>
        </Float>
      </motion.div>

      {/* Floating airtime chip */}
      <motion.div
        style={front}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.55 }}
        className="absolute bottom-2 left-0 lg:bottom-8 lg:left-2"
      >
        <Float duration={8} distance={14} delay={1.1} rotate={-6}>
          <div className="glass shadow-premium-sm flex items-center gap-2.5 rounded-2xl px-4 py-3">
            <div className="brand-primary-soft brand-primary-text flex h-8 w-8 items-center justify-center rounded-xl">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-900">₦500 airtime</p>
              <p className="text-[11px] text-slate-400">Delivered in 2s</p>
            </div>
          </div>
        </Float>
      </motion.div>

      {/* Electricity token chip */}
      <motion.div
        style={back}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
        className="absolute left-1 top-6 hidden lg:block"
      >
        <Float duration={9} distance={10} delay={0.8} rotate={5}>
          <div className="glass shadow-premium-sm flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-2xl">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-[9px] font-medium text-slate-500">Token</span>
          </div>
        </Float>
      </motion.div>

      {/* Success confirmation chip */}
      <motion.div
        style={front}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}
        className="absolute bottom-8 right-2 hidden sm:block lg:bottom-16 lg:right-0"
      >
        <Float duration={6.5} distance={12} delay={1.6}>
          <div className="glass-strong shadow-premium-sm flex items-center gap-2 rounded-full py-2 pl-2 pr-3.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-medium text-slate-700">Payment successful</span>
          </div>
        </Float>
      </motion.div>
    </div>
  );
}
