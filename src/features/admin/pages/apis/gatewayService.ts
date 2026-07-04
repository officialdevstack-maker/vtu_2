import { apiClient } from "@shared/api/apiClient";

type ApiEnvelope<T> = { status: boolean; message: string; data: T };

export type Gateway = {
  id: string | number;
  name: string;
  code?: string | null;
  balance?: string | number | null;
  connection?: boolean | null;
  username?: string | null;
  password?: string | null;
  category?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type GatewayPayload = {
  name: string;
  code?: string | null;
  username?: string | null;
  password?: string | null;
  connection?: boolean;
};

const BASE = "/table/providers";

// Known gateways that support outbound transfers (auto-fund payouts).
const TRANSFER_SUPPORT: Record<string, boolean> = {
  flutterwave: true,
  monnify: false,
  "payment point": false,
};

export const gatewaySupportsTransfer = (name: string) =>
  TRANSFER_SUPPORT[name.trim().toLowerCase()] ?? false;

export const gatewayService = {
  getAll: (): Promise<Gateway[]> =>
    apiClient
      .get<ApiEnvelope<{ data: Gateway[] }>>(BASE, {
        params: { category: "payment" },
      })
      .then((r) => r.data.data.data),

  getById: (id: string): Promise<Gateway> =>
    apiClient
      .get<ApiEnvelope<Gateway>>(`${BASE}/${id}`)
      .then((r) => r.data.data),

  create: (payload: GatewayPayload): Promise<Gateway> =>
    apiClient
      .post<ApiEnvelope<Gateway>>(BASE, { ...payload, category: "payment" })
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<GatewayPayload>): Promise<Gateway> =>
    apiClient
      .put<ApiEnvelope<Gateway>>(`${BASE}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`).then(() => undefined),

  toggleConnection: (g: Gateway): Promise<Gateway> =>
    apiClient
      .put<ApiEnvelope<Gateway>>(`${BASE}/${g.id}`, {
        connection: !g.connection,
      })
      .then((r) => r.data.data),
};
