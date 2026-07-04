import { apiClient } from "@shared/api/apiClient";

// The real payload sits exactly one `.data` deep: r.data.data (see
// backend/app/Http/Middleware/HandleRequest.php).
type ApiEnvelope<T> = { success: boolean; message: string; data: T };
export type PaginatedMeta = {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  from: number | null;
  to: number | null;
};

export type Provider = {
  id: string | number;
  name: string;
  code?: string | null;
  balance?: string | number | null;
  connection?: boolean | null;
  username?: string | null;
  password?: string | null;
  sub_category?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  // auto-fund fields
  auto_fund_enabled?: boolean | null;
  auto_fund_threshold?: string | number | null;
  auto_fund_amount?: string | number | null;
  account_number?: string | null;
  account_name?: string | null;
  bank_code?: string | null;
  bank_name?: string | null;
  funding_provider_id?: number | null;
};

export type ProviderPayload = {
  name: string;
  code?: string | null;
  username?: string | null;
  password?: string | null;
  sub_category?: string | null;
  connection?: boolean;
};

export type AutoFundPayload = {
  auto_fund_enabled: boolean;
  auto_fund_threshold?: number | null;
  auto_fund_amount?: number | null;
  account_number?: string | null;
  account_name?: string | null;
  bank_code?: string | null;
  bank_name?: string | null;
  funding_provider_id?: number | null;
};

export type FundingRecord = {
  id: number;
  vendor_id: number;
  payment_provider_id: number | null;
  amount: string;
  reference: string;
  status: "pending" | "success" | "failed";
  balance_before: string | null;
  gateway_response?: unknown;
  created_at: string;
  updated_at?: string | null;
  vendor?: { id: number; name: string } | null;
  payment_provider?: { id: number; name: string } | null;
};

export type ProviderBank = {
  code: string;
  name: string;
};

const BASE = "/table/vendors";

export const providerService = {
  getAll: (): Promise<Provider[]> =>
    apiClient.get<ApiEnvelope<Provider[]>>(BASE).then((r) => r.data.data),

  getById: (id: string): Promise<Provider> =>
    apiClient
      .get<ApiEnvelope<Provider>>(`${BASE}/${id}`)
      .then((r) => r.data.data),

  create: (payload: ProviderPayload): Promise<Provider> =>
    apiClient
      .post<ApiEnvelope<Provider>>(BASE, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<ProviderPayload>): Promise<Provider> =>
    apiClient
      .put<ApiEnvelope<Provider>>(`${BASE}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`).then(() => undefined),

  toggleConnection: (p: Provider): Promise<Provider> =>
    apiClient
      .put<ApiEnvelope<Provider>>(`${BASE}/${p.id}`, {
        connection: !p.connection,
      })
      .then((r) => r.data.data),

  refreshToken: (id: string): Promise<string> =>
    apiClient
      .get<ApiEnvelope<{ identifier: string }>>(
        `/admin/vendor/${id}/refresh-token`,
      )
      .then((r) => r.data.data.identifier),

  updateAutoFund: (
    id: string,
    payload: AutoFundPayload,
  ): Promise<Provider> =>
    apiClient
      .put<ApiEnvelope<Provider>>(`${BASE}/${id}`, payload)
      .then((r) => r.data.data),

  getPaymentProviders: (): Promise<Provider[]> =>
    apiClient
      .get<ApiEnvelope<Provider[]>>("/table/providers", {
        params: { category: "payment" },
      })
      .then((r) => r.data.data),

  getBanksForProvider: (providerId: string | number): Promise<ProviderBank[]> =>
    apiClient
      .get<ApiEnvelope<{ banks: ProviderBank[] }>>(`/admin/vendor/${providerId}/banks`)
      .then((r) => r.data.data.banks ?? []),

  getFundingHistory: (vendorId: string): Promise<FundingRecord[]> =>
    apiClient
      .get<ApiEnvelope<FundingRecord[]>>("/table/vendor_fundings", {
        params: {
          vendor_id: vendorId,
          sort: "created_at,desc",
          with: "paymentProvider",
        },
      })
      .then((r) => r.data.data),
};
