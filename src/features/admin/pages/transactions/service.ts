import { apiClient } from "@shared/api/apiClient";

// The real payload sits exactly one `.data` deep: r.data.data (see
// backend/app/Http/Middleware/HandleRequest.php).
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type TransactionType =
  | "airtime_recharge"
  | "data_subscription"
  | "cable_subscription"
  | "electric_bill"
  | "exam"
  | "betting_funding"
  | "airtime_pin"
  | "data_pin"
  | "wallet_funding"
  | "manual_funding"
  | "bulksms";

export type TransactionStatus = "pending" | "success" | "fail";

// Shape returned by TransactionResource against the `transactions` table.
export type Transaction = {
  id: number;
  user_id: string;
  amount: string | number;
  status: TransactionStatus;
  transaction_type: TransactionType;
  reference: string;
  payment_reference: string | null;
  promotion_id: number | null;
  created_at: string;
  updated_at: string;
  provider: string | null;
  recipient: string;
  account_or_phone: string | null;
  quantity: string | number;
  discount_amount: string | number;
  service_fee: string | number;
  funding_method: "bank_transfer" | "credit_card" | "manual" | "other" | null;
  balance_before: string | number;
  balance_after: string | number;
  completed_at: string | null;
  refunded_at: string | null;
  refund_reason: string | null;
  response_message: string | null;
  platform: string | null;
  plan_type: string | null;
  token: string | null;
  user: { id: string; fullname: string; email: string } | null;
};

// Transaction types where the wallet was actually charged — funding types
// (wallet_funding, manual_funding) move money in, not out, so they can't
// be "refunded" through this action. Mirrors Transaction::REFUNDABLE_TYPES
// on the backend.
export const REFUNDABLE_TYPES: TransactionType[] = [
  "airtime_recharge",
  "data_subscription",
  "cable_subscription",
  "electric_bill",
  "exam",
  "betting_funding",
  "airtime_pin",
  "data_pin",
  "bulksms",
];

const BASE = "/table/transactions";

export const transactionTypeLabels: Record<TransactionType, string> = {
  airtime_recharge: "Airtime",
  data_subscription: "Data",
  cable_subscription: "Cable",
  electric_bill: "Electricity",
  exam: "Exam PIN",
  betting_funding: "Betting",
  airtime_pin: "Airtime PIN",
  data_pin: "Data PIN",
  wallet_funding: "Wallet Funding",
  manual_funding: "Manual Funding",
  bulksms: "Bulk SMS",
};

export const transactionStatusLabels: Record<TransactionStatus, string> = {
  success: "Successful",
  pending: "Pending",
  fail: "Failed",
};

export const transactionService = {
  getAll: (): Promise<Transaction[]> =>
    apiClient
      .get<ApiEnvelope<Transaction[]>>(BASE, {
        params: { with: "user", sort: "created_at,desc" },
      })
      .then((r) => r.data.data),

  updateStatus: (
    id: number,
    status: TransactionStatus,
    note?: string,
  ): Promise<Transaction> =>
    apiClient
      .put<ApiEnvelope<Transaction>>(`/admin/transactions/${id}/status`, {
        status,
        note,
      })
      .then((r) => r.data.data),

  refund: (id: number, reason: string): Promise<Transaction> =>
    apiClient
      .post<ApiEnvelope<Transaction>>(`/admin/transactions/${id}/refund`, {
        reason,
      })
      .then((r) => r.data.data),
};
