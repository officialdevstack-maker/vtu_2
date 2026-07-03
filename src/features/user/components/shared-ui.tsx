import { CheckCircle, XCircle, Clock, AlertCircle, ChevronRight, RefreshCw, User, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { fmt } from "../data/mock";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    failed: "bg-red-50 text-red-700 border-red-100",
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    verified: "bg-emerald-50 text-emerald-700 border-emerald-100",
    active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    suspended: "bg-red-50 text-red-700 border-red-100",
    inactive: "bg-gray-100 text-gray-500 border-gray-200",
    unverified: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const icons: Record<string, React.ReactElement> = {
    success: <CheckCircle className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
    pending: <Clock className="w-3 h-3" />,
    verified: <CheckCircle className="w-3 h-3" />,
    active: <CheckCircle className="w-3 h-3" />,
    suspended: <XCircle className="w-3 h-3" />,
    inactive: <Clock className="w-3 h-3" />,
    unverified: <AlertCircle className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status] ?? styles.pending}`}>
      {icons[status] ?? icons.pending}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${value ? "bg-indigo-600" : "bg-gray-200"}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-100 rounded animate-pulse ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-7 w-7 rounded-lg" />
      </div>
      <SkeletonLine className="h-7 w-32" />
      <SkeletonLine className="h-3 w-16" />
    </div>
  );
}

// ─── Purchase flow primitives ───────────────────────────────────────────────
// Shared building blocks for the "select → confirm → success" pattern used by
// buy-airtime, buy-data, cable-tv, and electricity.

export function PurchaseShell({ children, maxWidth = "max-w-2xl" }: { children: ReactNode; maxWidth?: string }) {
  return (
    <div className={`p-4 lg:p-6 ${maxWidth} mx-auto`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">{children}</div>
    </div>
  );
}

export function ServiceHeader({
  icon: Icon, iconBg, iconColor, title, subtitle,
}: { icon: LucideIcon; iconBg: string; iconColor: string; title: string; subtitle: string }) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export function WalletBalanceBanner({ balance }: { balance: number }) {
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between">
      <span className="text-sm text-indigo-700 font-medium">Wallet Balance</span>
      <span className="text-sm font-bold text-indigo-900">{fmt(balance)}</span>
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">{children}</label>;
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
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${value === n.id ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}
        >
          <div className={`w-9 h-9 ${n.bg} rounded-xl flex items-center justify-center text-white text-xs font-bold`}>{n.name[0]}</div>
          <span className="text-xs font-semibold text-gray-700">{n.name}</span>
          {n.extra && <span className="text-xs text-emerald-600 font-medium">{n.extra}</span>}
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
          className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${value === String(a) ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
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
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition font-mono"
        />
        <button
          onClick={onVerify}
          disabled={verifying}
          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition"
        >
          {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify"}
        </button>
      </div>
      {verified && (
        <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <User className="w-4 h-4" />
            <span className="text-sm font-bold">{verifiedLabel}</span>
            <CheckCircle className="w-4 h-4 ml-auto" />
          </div>
          {verifiedSub && <p className="text-xs text-emerald-600">{verifiedSub}</p>}
        </div>
      )}
    </div>
  );
}

export function ContinueButton({ onClick, disabled, children = "Continue" }: {
  onClick: () => void; disabled?: boolean; children?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md shadow-indigo-100 flex items-center justify-center gap-1"
    >
      {children} <ChevronRight className="w-4 h-4" />
    </button>
  );
}

export type ConfirmRow = { label: string; value: string; emphasize?: "success" };

export function ConfirmSummary({ title = "Confirm Purchase", rows, totalRow }: {
  title?: string; rows: ConfirmRow[]; totalRow?: { label: string; value: string };
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 mb-5 space-y-3.5">
      {title && <h3 className="text-sm font-bold text-gray-900 mb-3">{title}</h3>}
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between text-sm">
          <span className="text-gray-500">{r.label}</span>
          <span className={`font-semibold ${r.emphasize === "success" ? "text-emerald-600" : "text-gray-900"}`}>{r.value}</span>
        </div>
      ))}
      {totalRow && (
        <div className="border-t border-gray-200 pt-3 flex justify-between font-bold">
          <span>{totalRow.label}</span>
          <span className="text-gray-900">{totalRow.value}</span>
        </div>
      )}
    </div>
  );
}

export function ConfirmActions({ onBack, onConfirm, loading, confirmLabel = "Confirm & Pay" }: {
  onBack: () => void; onConfirm: () => void; loading: boolean; confirmLabel?: string;
}) {
  return (
    <div className="flex gap-3">
      <button onClick={onBack} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition">
        Back
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : confirmLabel}
      </button>
    </div>
  );
}

export function SuccessScreen({
  title, message, onReset, resetLabel = "Buy Again", secondaryLabel = "View Receipt", onSecondary, children,
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
    <div className="p-4 lg:p-6 max-w-lg mx-auto pt-10">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
        <div className="text-gray-500 text-sm mb-6">{message}</div>
        {children}
        <div className="flex gap-3">
          <button onClick={onReset} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition">
            {resetLabel}
          </button>
          <button onClick={onSecondary} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition">
            {secondaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
