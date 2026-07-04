import { apiClient } from "../../../../shared/api/apiClient";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Network = {
  id: string;
  name: string;
  code: string;
  provider: string;
  status: "active" | "inactive";
};

export type NetworkPayload = Omit<Network, "id">;

// ─── Network service ─────────────────────────────────────────────────────────
// Endpoint base: /admin/networks — change the path here if the API moves.

const BASE = "/admin/networks";

export const networkService = {
  getAll: (): Promise<Network[]> =>
    apiClient.get<{ data: Network[] }>(BASE).then((r) => r.data.data),

  create: (payload: NetworkPayload): Promise<Network> =>
    apiClient
      .post<{ data: Network }>(BASE, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<NetworkPayload>): Promise<Network> =>
    apiClient
      .patch<{ data: Network }>(`${BASE}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`).then(() => undefined),

  toggleStatus: (id: string): Promise<Network> =>
    apiClient
      .patch<{ data: Network }>(`${BASE}/${id}/toggle`)
      .then((r) => r.data.data),
};
