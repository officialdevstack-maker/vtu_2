import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

export function GlassCard({
  children,
  className,
  strong = false,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  as?: "div" | "article" | "li";
}) {
  const As_ = As as "div";
  return (
    <As_ className={clsx(strong ? "glass-strong" : "glass", "shadow-premium-sm rounded-3xl", className)}>
      {children}
    </As_>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="glass shadow-premium-sm brand-primary-text inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide">
      {children}
    </span>
  );
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
}: {
  kicker?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={clsx("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {kicker && (
        <span className="brand-primary-text text-xs font-semibold uppercase tracking-[0.14em]">{kicker}</span>
      )}
      <h2 className="text-balance mt-3 text-3xl font-semibold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-slate-500">{description}</p>
      )}
    </div>
  );
}

type ButtonVariant = "primary" | "ghost" | "ghost-dark";
type ButtonSize = "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "brand-primary-button text-white shadow-premium-brand hover:-translate-y-0.5",
  ghost:
    "glass text-slate-700 hover:-translate-y-0.5 hover:bg-white/90 shadow-premium-sm",
  "ghost-dark":
    "glass-dark text-white hover:-translate-y-0.5 hover:bg-white/[0.1]",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-[15px]",
};

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  to?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  to,
  href,
  onClick,
  className,
  type = "button",
}: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 ease-out",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  const content = <span className={`${classes} active:scale-[0.97]`}>{children}</span>;

  if (to) {
    return (
      <Link to={to} className="inline-block">
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className="inline-block">
        {content}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className="inline-block">
      {content}
    </button>
  );
}

export function GlowOrb({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={style}
      className={clsx(
        "animate-glow-pulse pointer-events-none absolute rounded-full blur-3xl",
        className,
      )}
    />
  );
}
