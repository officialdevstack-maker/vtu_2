import type { ReactNode } from "react";
import { Wifi, ArrowUpRight, ArrowDownLeft, CheckCircle2, Copy, ScanLine, Building2 } from "lucide-react";

export function MockupWindow({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <div className={`glass-strong shadow-premium w-[280px] overflow-hidden rounded-[22px] ${className ?? ""}`}>
      <div className="flex items-center gap-1.5 border-b border-slate-900/[0.06] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="ml-2 text-[11px] font-medium text-slate-400">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

const txns = [
  { label: "MTN Airtime", amount: "-₦1,000", icon: ArrowUpRight, tone: "text-rose-500" },
  { label: "Wallet funding", amount: "+₦20,000", icon: ArrowDownLeft, tone: "text-emerald-500" },
  { label: "DStv Compact", amount: "-₦19,000", icon: ArrowUpRight, tone: "text-rose-500" },
];

export function WalletMockup() {
  return (
    <MockupWindow title="Wallet">
      <p className="text-[11px] font-medium text-slate-400">Available balance</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">₦128,450.00</p>
      <div className="mt-4 space-y-2.5">
        {txns.map((t) => (
          <div key={t.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900/[0.04]">
                <t.icon className={`h-3.5 w-3.5 ${t.tone}`} />
              </span>
              <span className="text-xs font-medium text-slate-700">{t.label}</span>
            </div>
            <span className="text-xs font-medium text-slate-500">{t.amount}</span>
          </div>
        ))}
      </div>
    </MockupWindow>
  );
}

export function BuyDataMockup() {
  return (
    <MockupWindow title="Buy data">
      <div className="flex items-center gap-2">
        <span className="brand-primary-bg flex h-9 w-9 items-center justify-center rounded-xl">
          <Wifi className="h-4 w-4 text-white" />
        </span>
        <div>
          <p className="text-xs font-semibold text-slate-900">MTN — SME 2.0</p>
          <p className="text-[11px] text-slate-400">0801 234 5678</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {["1GB · ₦300", "2.5GB · ₦700", "5GB · ₦1,300", "10GB · ₦2,500"].map((plan, i) => (
          <div
            key={plan}
            className={`rounded-xl border px-2.5 py-2 text-[11px] font-medium ${
              i === 1
                ? "brand-primary-soft brand-primary-border brand-primary-text"
                : "border-slate-900/[0.06] text-slate-500"
            }`}
          >
            {plan}
          </div>
        ))}
      </div>
      <div className="brand-primary-bg mt-4 rounded-xl py-2.5 text-center text-xs font-semibold text-white">
        Pay ₦700
      </div>
    </MockupWindow>
  );
}

export function SuccessMockup() {
  return (
    <MockupWindow title="Confirmation">
      <div className="flex flex-col items-center py-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-900">Payment successful</p>
        <p className="mt-1 text-[11px] text-slate-400">Ref: KRA-88213-NG</p>
        <p className="mt-3 text-xl font-semibold text-slate-900">₦19,000.00</p>
        <div className="mt-4 w-full rounded-xl bg-slate-900/[0.05] py-2 text-center text-xs font-medium text-slate-600">
          Done
        </div>
      </div>
    </MockupWindow>
  );
}

export function QrMockup() {
  return (
    <MockupWindow title="Scan to pay">
      <div className="flex flex-col items-center py-1 text-center">
        <div className="grid grid-cols-6 gap-[3px] rounded-xl bg-white p-3 shadow-inner">
          {Array.from({ length: 36 }).map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-[2px] ${[2, 5, 7, 9, 13, 18, 20, 24, 27, 30, 33].includes(i) ? "bg-slate-900" : "bg-slate-900/15"}`}
            />
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <ScanLine className="h-3.5 w-3.5" /> Scan with any banking app
        </p>
      </div>
    </MockupWindow>
  );
}

const history = [
  { label: "Electricity — EKEDC", ref: "Today, 10:42am", amount: "-₦8,000", status: "Success" },
  { label: "GOtv Max", ref: "Today, 9:15am", amount: "-₦6,200", status: "Success" },
  { label: "Wallet funding", ref: "Yesterday", amount: "+₦50,000", status: "Success" },
  { label: "Airtel Airtime", ref: "Yesterday", amount: "-₦2,000", status: "Success" },
];

export function HistoryMockup() {
  return (
    <MockupWindow title="Transactions">
      <div className="space-y-3">
        {history.map((h) => (
          <div key={h.label} className="flex items-center justify-between border-b border-slate-900/[0.05] pb-2.5 last:border-0 last:pb-0">
            <div>
              <p className="text-xs font-medium text-slate-700">{h.label}</p>
              <p className="text-[10px] text-slate-400">{h.ref}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-slate-800">{h.amount}</p>
              <p className="text-[10px] font-medium text-emerald-500">{h.status}</p>
            </div>
          </div>
        ))}
      </div>
    </MockupWindow>
  );
}

export function AccountMockup() {
  return (
    <MockupWindow title="Virtual account">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/[0.05]">
          <Building2 className="h-4 w-4 text-slate-600" />
        </span>
        <div>
          <p className="text-xs font-semibold text-slate-900">Moniepoint MFB</p>
          <p className="text-[11px] text-slate-400">Dedicated virtual account</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900/[0.04] px-3 py-2.5">
        <span className="font-mono text-sm font-semibold tracking-wide text-slate-800">8123 456 789</span>
        <Copy className="h-3.5 w-3.5 text-slate-400" />
      </div>
    </MockupWindow>
  );
}
