import {
  CheckCircle2, XCircle, Send, Landmark, Gift, Bell, UserPlus, AlertTriangle,
  type LucideIcon,
} from "lucide-react";

// Maps App\Notifications\AppNotification's free-form `type` key to an icon +
// a tone. Falls back to a generic bell for any type not listed here, so a
// new backend notification type never breaks rendering — it just looks
// generic until someone adds it here.
export const notificationMeta: Record<string, { icon: LucideIcon; tone: "success" | "warning" | "error" | "info" }> = {
  transaction_success: { icon: CheckCircle2, tone: "success" },
  transaction_failed: { icon: XCircle, tone: "error" },
  wallet_funded: { icon: Landmark, tone: "success" },
  wallet_transfer_in: { icon: Send, tone: "success" },
  wallet_withdrawal_completed: { icon: Landmark, tone: "success" },
  wallet_withdrawal_failed: { icon: Landmark, tone: "error" },
  wallet_withdrawal_rejected: { icon: Landmark, tone: "error" },
  airtime_to_cash_approved: { icon: CheckCircle2, tone: "success" },
  airtime_to_cash_rejected: { icon: XCircle, tone: "error" },
  referral_commission: { icon: Gift, tone: "success" },
  admin_new_signup: { icon: UserPlus, tone: "info" },
  admin_wallet_funding: { icon: Landmark, tone: "info" },
  admin_failed_transaction: { icon: AlertTriangle, tone: "error" },
  admin_large_transaction: { icon: AlertTriangle, tone: "warning" },
  admin_pending_airtime_to_cash: { icon: AlertTriangle, tone: "warning" },
  admin_pending_wallet_withdrawal: { icon: AlertTriangle, tone: "warning" },
};

export const toneStyles: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  error: "bg-red-50 text-red-600",
  info: "bg-blue-50 text-blue-600",
};

export function notificationIcon(type: string): { icon: LucideIcon; tone: string } {
  return notificationMeta[type] ?? { icon: Bell, tone: "info" };
}

export const dateLabel = (value: string) =>
  new Date(value).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
