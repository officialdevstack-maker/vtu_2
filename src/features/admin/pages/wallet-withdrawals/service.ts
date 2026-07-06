import { apiClient } from "@shared/api/apiClient";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type WalletWithdrawalStatus = "pending" | "completed" | "failed" | "rejected";

// A customer's withdrawal request — deliberately NOT served via the generic
// Universal Table API (see AdminController::RESTRICTED_TABLES), since that
// endpoint is reachable by any logged-in user and this holds bank account
// details. Only reachable here through the permission-gated
// /admin/wallet-withdrawals endpoints (reuses the "wallets" permission).
export type WalletWithdrawal = {
  id: number;
  amount: string | number;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: WalletWithdrawalStatus;
  rejection_reason: string | null;
  gateway_reference: string | null;
  transaction_reference: string;
  reviewed_at: string | null;
  created_at: string;
  user?: { id: number; username: string; email: string; phone: string } | null;
  reviewer?: { id: number; username: string } | null;
};

const BASE = "/admin/wallet-withdrawals";

export const walletWithdrawalService = {
  getAll: (): Promise<WalletWithdrawal[]> =>
    apiClient.get<ApiEnvelope<WalletWithdrawal[]>>(BASE).then((r) => r.data.data),

  approve: (id: string | number): Promise<WalletWithdrawal> =>
    apiClient
      .post<ApiEnvelope<WalletWithdrawal>>(`${BASE}/${id}/approve`)
      .then((r) => r.data.data),

  reject: (id: string | number, reason: string): Promise<WalletWithdrawal> =>
    apiClient
      .post<ApiEnvelope<WalletWithdrawal>>(`${BASE}/${id}/reject`, { reason })
      .then((r) => r.data.data),
};
