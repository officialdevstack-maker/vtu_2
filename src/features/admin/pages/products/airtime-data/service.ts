import { apiClient } from "@shared/api/apiClient";

// ─── Network ──────────────────────────────────────────────────────────────────

export type Network = {
  id: string;
  name: string;
  code: string;
  provider: string;
  status: "active" | "inactive";
};

export type NetworkPayload = Omit<Network, "id">;

// Endpoint base: /admin/networks — change here if the API moves.
const NETWORK_BASE = "/admin/networks";

export const networkService = {
  getAll: (): Promise<Network[]> =>
    apiClient.get<{ data: Network[] }>(NETWORK_BASE).then((r) => r.data.data),

  create: (payload: NetworkPayload): Promise<Network> =>
    apiClient
      .post<{ data: Network }>(NETWORK_BASE, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<NetworkPayload>): Promise<Network> =>
    apiClient
      .patch<{ data: Network }>(`${NETWORK_BASE}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${NETWORK_BASE}/${id}`).then(() => undefined),

  toggleStatus: (id: string): Promise<Network> =>
    apiClient
      .patch<{ data: Network }>(`${NETWORK_BASE}/${id}/toggle`)
      .then((r) => r.data.data),
};

// ─── Network type ─────────────────────────────────────────────────────────────

export type NetworkType = {
  id: string;
  name: string;
  network_id: string;
  network: string; // network name — for display only
  description: string;
  status: "active" | "inactive";
};

export type NetworkTypePayload = {
  name: string;
  network_id: string;
  description: string;
  status: "active" | "inactive";
};

// Endpoint base: /admin/network-types — change here if the API moves.
const TYPE_BASE = "/admin/network-types";

export const networkTypeService = {
  getAll: (): Promise<NetworkType[]> =>
    apiClient.get<{ data: NetworkType[] }>(TYPE_BASE).then((r) => r.data.data),

  create: (payload: NetworkTypePayload): Promise<NetworkType> =>
    apiClient
      .post<{ data: NetworkType }>(TYPE_BASE, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<NetworkTypePayload>): Promise<NetworkType> =>
    apiClient
      .patch<{ data: NetworkType }>(`${TYPE_BASE}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${TYPE_BASE}/${id}`).then(() => undefined),

  toggleStatus: (id: string): Promise<NetworkType> =>
    apiClient
      .patch<{ data: NetworkType }>(`${TYPE_BASE}/${id}/toggle`)
      .then((r) => r.data.data),
};
