import {
  CheckCircle2, XCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, Loader2, RefreshCw, User,
  Copy, Check,
  type LucideIcon,
} from "lucide-react";
import { useState, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { fmt } from "../data/mock";
import { cn } from "@/shared/utils";

// ─── Design primitives ──────────────────────────────────────────────────────
// Single source of truth for buttons, cards, inputs, tables, badges and page
// headers so every page shares the same radius, spacing, border and type
// scale instead of drifting per-file.

export const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:shadow-none",
  secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 disabled:opacity-50",
  ghost: "text-slate-600 hover:bg-slate-100 disabled:opacity-50",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export function Button({
  variant = "primary", size = "md", fullWidth, loading, disabled, className = "", children, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; loading?: boolean;
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition-colors disabled:cursor-not-allowed",
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-white border border-slate-200/70 rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]", className)} {...props}>
      {children}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger";

const toneStyles: Record<Tone, string> = {
  neutral: "bg-indigo-50 text-indigo-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
};

export function StatCard({ label, value, icon: Icon, tone = "neutral", meta }: {
  label: string; value: string; icon: LucideIcon; tone?: Tone; meta?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${toneStyles[tone]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl font-semibold text-slate-900 tabular-nums">{value}</p>
      {meta && <p className="text-xs text-slate-400 mt-1">{meta}</p>}
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="py-14 text-center">
      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

const statusMap: Record<string, { dot: string; text: string; label: string }> = {
  success: { dot: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50", label: "Successful" },
  successful: { dot: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50", label: "Successful" },
  pending: { dot: "bg-amber-500", text: "text-amber-700 bg-amber-50", label: "Pending" },
  processing: { dot: "bg-blue-500", text: "text-blue-700 bg-blue-50", label: "Processing" },
  failed: { dot: "bg-red-500", text: "text-red-700 bg-red-50", label: "Failed" },
  verified: { dot: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50", label: "Verified" },
  active: { dot: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50", label: "Active" },
  suspended: { dot: "bg-red-500", text: "text-red-700 bg-red-50", label: "Suspended" },
  inactive: { dot: "bg-slate-400", text: "text-slate-600 bg-slate-100", label: "Inactive" },
  unverified: { dot: "bg-slate-400", text: "text-slate-600 bg-slate-100", label: "Unverified" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status?.toLowerCase()] ?? statusMap.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable or permission denied — nothing to fall
      // back to safely, so just leave the value selectable for manual copy.
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
      title={`Copy ${label ?? "value"}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-5.5 rounded-full transition-colors relative shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${value ? "bg-indigo-600" : "bg-slate-200"}`}
    >
      <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`bg-slate-100 rounded animate-pulse ${className}`} />;
}

export function SkeletonCard() {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-8 w-8 rounded-xl" />
      </div>
      <SkeletonLine className="h-6 w-32" />
      <SkeletonLine className="h-3 w-16" />
    </Card>
  );
}

// ─── Loading system ─────────────────────────────────────────────────────────
// One reusable set of loading primitives for the whole admin dashboard: a top
// route-transition bar, a full-section spinner, and parameterized skeletons
// for the stat-grid / row-list shapes repeated across nearly every page.

const spinnerSizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" } as const;

export function Spinner({ size = "md", className = "" }: { size?: keyof typeof spinnerSizes; className?: string }) {
  return <Loader2 className={cn(spinnerSizes[size], "animate-spin text-indigo-600", className)} />;
}

export function LoadingScreen({ label = "Loading…", fullScreen = true }: { label?: string; fullScreen?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", fullScreen ? "min-h-[60vh]" : "py-16")}>
      <Spinner size="lg" />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

export function TopLoadingBar({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0",
      )}
      aria-hidden={!active}
    >
      <div className="h-full w-1/3 animate-[loading-bar_1.1s_ease-in-out_infinite] bg-indigo-600" />
    </div>
  );
}

export function SkeletonStatGrid({ count = 4, className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" }: {
  count?: number; className?: string;
}) {
  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonLine className="h-3 w-24" />
            <SkeletonLine className="h-8 w-8 rounded-xl" />
          </div>
          <SkeletonLine className="h-6 w-16" />
        </Card>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5, withAvatar = true, className = "" }: {
  count?: number; withAvatar?: boolean; className?: string;
}) {
  return (
    <div className={cn("p-4 space-y-3", className)}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {withAvatar && <SkeletonLine className="h-8 w-8 rounded-full shrink-0" />}
          <SkeletonLine className="h-3 flex-1" />
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

const DEFAULT_PAGE_SIZE = 10;

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
  label = "records",
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  const firstRecord = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRecord = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-400">
        Showing {firstRecord}-{lastRecord} of {totalItems} {label}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`h-8 min-w-8 rounded-xl px-2 text-xs font-medium transition-colors ${
                currentPage === pageNumber
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {pageNumber}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Purchase flow primitives ───────────────────────────────────────────────
// Shared building blocks for the "select → confirm → success" pattern used by
// buy-airtime, buy-data, cable-tv, and electricity.

export function PurchaseShell({ children, maxWidth = "max-w-xl" }: { children: ReactNode; maxWidth?: string }) {
  return (
    <div className={maxWidth}>
      <Card className="overflow-hidden">{children}</Card>
    </div>
  );
}

export function ServiceHeader({
  icon: Icon, iconBg, iconColor, title, subtitle,
}: { icon: LucideIcon; iconBg: string; iconColor: string; title: string; subtitle: string }) {
  return (
    <div className="px-5 pt-5 pb-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export function WalletBalanceBanner({ balance }: { balance: number }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-3 flex items-center justify-between">
      <span className="text-sm text-slate-500">Wallet balance</span>
      <span className="text-sm font-semibold text-slate-900">{fmt(balance)}</span>
    </div>
  );
}

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="block text-xs font-medium text-slate-600">{children}</label>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

export type NetworkOption = { id: string; name: string; bg: string; extra?: string };

export function NetworkPicker({ networks, value, onChange }: {
  networks: NetworkOption[]; value: string; onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {networks.map((n) => (
        <button
          key={n.id}
          onClick={() => onChange(n.id)}
          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-colors ${value === n.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}
        >
          <div className={`w-8 h-8 ${n.bg} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>{n.name[0]}</div>
          <span className="text-xs font-medium text-slate-700">{n.name}</span>
          {n.extra && <span className="text-xs text-emerald-600">{n.extra}</span>}
        </button>
      ))}
    </div>
  );
}

export function QuickAmountGrid({ amounts, value, onChange, columns = 3 }: {
  amounts: number[]; value: string; onChange: (v: string) => void; columns?: 3 | 4;
}) {
  return (
    <div className={`grid ${columns === 4 ? "grid-cols-4" : "grid-cols-3"} gap-2 mb-2.5`}>
      {amounts.map((a) => (
        <button
          key={a}
          onClick={() => onChange(String(a))}
          className={`py-2 text-xs font-medium rounded-lg border transition-colors ${value === String(a) ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-slate-600 hover:border-gray-300"}`}
        >
          ₦{a >= 1000 ? `${a / 1000}k` : a}
        </button>
      ))}
    </div>
  );
}

export function VerifyField({
  label, value, onChange, onVerify, verifying, verified, verifiedLabel, verifiedSub, maxLength, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onVerify: () => void;
  verifying: boolean;
  verified: boolean;
  verifiedLabel?: string;
  verifiedSub?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-2">
        <input
          type="text"
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          placeholder={placeholder}
          className={`${inputCls} flex-1 font-mono`}
        />
        <Button variant="secondary" onClick={onVerify} disabled={verifying} loading={verifying}>
          {verifying ? "" : "Verify"}
        </Button>
      </div>
      {verified && (
        <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-2 text-emerald-700">
            <User className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">{verifiedLabel}</span>
            <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />
          </div>
          {verifiedSub && <p className="text-xs text-emerald-600 mt-0.5">{verifiedSub}</p>}
        </div>
      )}
    </div>
  );
}

export function ContinueButton({ onClick, disabled, children = "Continue" }: {
  onClick: () => void; disabled?: boolean; children?: ReactNode;
}) {
  return (
    <Button onClick={onClick} disabled={disabled} fullWidth size="md" className="py-3">
      {children} <ChevronRight className="w-4 h-4" />
    </Button>
  );
}

export type ConfirmRow = { label: string; value: string; emphasize?: "success" };

export function ConfirmSummary({ title = "Confirm purchase", rows, totalRow }: {
  title?: string; rows: ConfirmRow[]; totalRow?: { label: string; value: string };
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5 space-y-3">
      {title && <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>}
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between text-sm">
          <span className="text-slate-500">{r.label}</span>
          <span className={`font-medium ${r.emphasize === "success" ? "text-emerald-600" : "text-slate-900"}`}>{r.value}</span>
        </div>
      ))}
      {totalRow && (
        <div className="border-t border-gray-200 pt-3 flex justify-between text-sm font-semibold text-slate-900">
          <span>{totalRow.label}</span>
          <span>{totalRow.value}</span>
        </div>
      )}
    </div>
  );
}

export function ConfirmActions({ onBack, onConfirm, loading, confirmLabel = "Confirm & pay" }: {
  onBack: () => void; onConfirm: () => void; loading: boolean; confirmLabel?: string;
}) {
  return (
    <div className="flex gap-3">
      <Button variant="secondary" onClick={onBack} fullWidth className="py-3">Back</Button>
      <Button onClick={onConfirm} disabled={loading} loading={loading} fullWidth className="py-3">
        {loading ? "" : confirmLabel}
      </Button>
    </div>
  );
}

export function SuccessScreen({
  title, message, onReset, resetLabel = "Make another payment", secondaryLabel = "View receipt", onSecondary, children,
}: {
  title: string;
  message: ReactNode;
  onReset: () => void;
  resetLabel?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="max-w-md mx-auto">
      <Card className="p-8 text-center">
        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 mb-1">{title}</h2>
        <div className="text-slate-500 text-sm mb-5">{message}</div>
        {children}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onReset} fullWidth>{resetLabel}</Button>
          <Button onClick={onSecondary} fullWidth>{secondaryLabel}</Button>
        </div>
      </Card>
    </div>
  );
}

export { CheckCircle2, XCircle, Clock, AlertCircle };
