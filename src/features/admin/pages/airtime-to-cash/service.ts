import { apiClient } from "@shared/api/apiClient";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// An admin-configured network (Products > Airtime to Cash > Networks) — the
// destination number customers transfer airtime to, and the amount range
// accepted. Read/written via the generic Universal Table API (no PII, safe
// for that). See app/Models/AirtimeToCashNetwork.
export type AirtimeToCashNetwork = {
  id: number;
  network: string;
  destination_number: string;
  min: string | number;
  max: string | number;
  active: boolean;
  status?: string;
};

export type AirtimeToCashNetworkPayload = {
  network: string;
  destination_number: string;
  min: number;
  max: number;
  active: boolean;
};

const NETWORK = "/table/airtime_to_cash_networks";

export const airtimeToCashNetworkService = {
  getAll: (): Promise<AirtimeToCashNetwork[]> =>
    apiClient.get<ApiEnvelope<AirtimeToCashNetwork[]>>(NETWORK).then((r) => r.data.data),

  create: (payload: AirtimeToCashNetworkPayload): Promise<AirtimeToCashNetwork> =>
    apiClient.post<ApiEnvelope<AirtimeToCashNetwork>>(NETWORK, payload).then((r) => r.data.data),

  update: (id: string | number, payload: Partial<AirtimeToCashNetworkPayload>): Promise<AirtimeToCashNetwork> =>
    apiClient.put<ApiEnvelope<AirtimeToCashNetwork>>(`${NETWORK}/${id}`, payload).then((r) => r.data.data),

  remove: (id: string | number): Promise<void> =>
    apiClient.delete(`${NETWORK}/${id}`).then(() => undefined),

  toggleStatus: (network: AirtimeToCashNetwork): Promise<AirtimeToCashNetwork> =>
    apiClient
      .put<ApiEnvelope<AirtimeToCashNetwork>>(`${NETWORK}/${network.id}`, { active: !network.active })
      .then((r) => r.data.data),
};

export type AirtimeToCashStatus = "pending" | "approved" | "rejected";

// A customer's conversion request — deliberately NOT served via the generic
// Universal Table API (see AdminController::RESTRICTED_TABLES), since that
// endpoint is reachable by any logged-in user and this holds other users'
// phone numbers and proof uploads. Only reachable here through the
// permission-gated /admin/airtime-to-cash endpoints.
export type AirtimeToCashRequest = {
  id: number;
  network: string;
  amount: string | number;
  sender_phone: string;
  destination_number: string;
  payout_amount: string | number;
  status: AirtimeToCashStatus;
  rejection_reason: string | null;
  proof_image: string | null;
  transaction_reference: string;
  payout_transaction_reference: string | null;
  reviewed_at: string | null;
  created_at: string;
  user?: { id: number; username: string; email: string; phone: string } | null;
  reviewer?: { id: number; username: string } | null;
};

const REQUESTS = "/admin/airtime-to-cash";

export const airtimeToCashRequestService = {
  getAll: (): Promise<AirtimeToCashRequest[]> =>
    apiClient.get<ApiEnvelope<AirtimeToCashRequest[]>>(REQUESTS).then((r) => r.data.data),

  approve: (id: string | number): Promise<AirtimeToCashRequest> =>
    apiClient
      .post<ApiEnvelope<AirtimeToCashRequest>>(`${REQUESTS}/${id}/approve`)
      .then((r) => r.data.data),

  reject: (id: string | number, reason: string): Promise<AirtimeToCashRequest> =>
    apiClient
      .post<ApiEnvelope<AirtimeToCashRequest>>(`${REQUESTS}/${id}/reject`, { reason })
      .then((r) => r.data.data),
};
