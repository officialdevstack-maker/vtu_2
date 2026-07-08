import { motion, useReducedMotion, type Variants, type HTMLMotionProps } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

// Fade-up-and-unblur on scroll into view. The workhorse reveal used across
// every section so scroll motion reads as one consistent system rather than
// a different easing per section.
const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

type RevealProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
};

export function Reveal({ children, delay = 0, ...rest }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={rest.className}>{children}</div>;
  }

  return (
    <motion.div
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// Stagger container: wrap a list of Reveal-less children and each direct
// child fades up in sequence. Use for grids/rows of cards.
const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={revealVariants} className={className}>
      {children}
    </motion.div>
  );
}

// CSS-driven continuous float (see .animate-float in landing.css) — kept as
// plain CSS rather than a Framer Motion loop so dozens of floating elements
// don't each run their own JS animation frame.
type FloatProps = {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  distance?: number;
  rotate?: number;
};

export function Float({ children, className, duration = 7, delay = 0, distance = 14, rotate = 0 }: FloatProps) {
  return (
    <div
      className={`animate-float ${className ?? ""}`}
      style={
        {
          "--float-duration": `${duration}s`,
          "--float-delay": `${delay}s`,
          "--float-y": `-${distance}px`,
          "--float-rot": `${rotate}deg`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
