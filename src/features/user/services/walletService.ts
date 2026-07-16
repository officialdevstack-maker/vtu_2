import { apiClient } from "@shared/api/apiClient";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type FundingAccountResponse = {
  status: "ready" | "pending" | "identity_required" | "failed";
  message?: string;
  retryable?: boolean;
  account?: {
    account_number: string;
    bank_name: string;
    account_name: string | null;
    currency: string;
  };
};

export const walletService = {
  getFundingAccount: (): Promise<FundingAccountResponse> =>
    apiClient.get<FundingAccountResponse>("/wallet/funding-account").then((r) => r.data),
  // Regenerates the user's dedicated virtual account(s) — one per active
  // payment provider. Safe to call even if some/all already exist (the
  // backend skips providers a Bank row already exists for). Used when
  // banks is empty, e.g. none were active yet at registration.
  generateVirtualAccounts: (): Promise<{ user: Record<string, unknown> }> =>
    apiClient
      .post<ApiEnvelope<{ user: Record<string, unknown> }>>("/account/virtual-accounts")
      .then((r) => r.data.data),
};
