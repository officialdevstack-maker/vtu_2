import { apiClient } from "@shared/api/apiClient";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// Per-network airtime-to-cash config (destination number, amount range,
// enabled) lives directly on the Network model now — configured under
// Products > Airtime & Data > Networks, not here. See
// features/admin/pages/products/airtime-data/network-tab.tsx.

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
