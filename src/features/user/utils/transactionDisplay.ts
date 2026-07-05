import {
  Phone, Wifi, Tv, Plug, GraduationCap, ArrowUpRight, ArrowDownLeft, MessageSquare,
  type LucideIcon,
} from "lucide-react";
import type { UserTransaction } from "../../../shared/providers/auth";

export const transactionTypeMeta: Record<string, { label: string; icon: LucideIcon }> = {
  airtime_recharge: { label: "Airtime", icon: Phone },
  data_subscription: { label: "Data bundle", icon: Wifi },
  cable_subscription: { label: "Cable TV", icon: Tv },
  electric_bill: { label: "Electricity", icon: Plug },
  exam: { label: "Exam PIN", icon: GraduationCap },
  betting_funding: { label: "Betting funding", icon: ArrowUpRight },
  airtime_pin: { label: "Airtime PIN", icon: Phone },
  data_pin: { label: "Data PIN", icon: Wifi },
  wallet_funding: { label: "Wallet funding", icon: ArrowDownLeft },
  manual_funding: { label: "Wallet adjustment", icon: ArrowDownLeft },
  bulksms: { label: "Bulk SMS", icon: MessageSquare },
};

export const isCredit = (tx: UserTransaction) =>
  tx.transaction_type === "wallet_funding" ||
  (tx.transaction_type === "manual_funding" && tx.plan_type === "credit");

export const toNumber = (v: string | number | undefined | null) => {
  const n = typeof v === "string" ? parseFloat(v) : (v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

// StatusBadge only recognizes "failed", not the backend's "fail".
export const badgeStatus = (status: UserTransaction["status"]) =>
  status === "fail" ? "failed" : status;

export const dateLabel = (value: string) =>
  new Date(value).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
