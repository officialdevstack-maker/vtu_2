import { apiClient } from "@shared/api/apiClient";

// Envelope returned by all API endpoints: { status, message, data }
type ApiEnvelope<T> = { status: boolean; message: string; data: T };

// ─── Network ──────────────────────────────────────────────────────────────────
// Uses the Universal Table API: /table/networks

export type Network = {
  id: string;
  name: string;
  code: string;
  provider: string;
  status: "active" | "inactive";
};

export type NetworkPayload = Omit<Network, "id">;

const NET = "/table/networks";

export const networkService = {
  getAll: (): Promise<Network[]> =>
    apiClient
      .get<ApiEnvelope<Network[]>>(NET)
      .then((r) => r.data.data),

  create: (payload: NetworkPayload): Promise<Network> =>
    apiClient
      .post<ApiEnvelope<Network>>(NET, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<NetworkPayload>): Promise<Network> =>
    apiClient
      .put<ApiEnvelope<Network>>(`${NET}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${NET}/${id}`).then(() => undefined),

  // No dedicated toggle endpoint — PUT the flipped status value.
  toggleStatus: (network: Network): Promise<Network> =>
    apiClient
      .put<ApiEnvelope<Network>>(`${NET}/${network.id}`, {
        status: network.status === "active" ? "inactive" : "active",
      })
      .then((r) => r.data.data),
};

// ─── Network type ─────────────────────────────────────────────────────────────
// Uses the Universal Table API: /table/network_types

export type NetworkType = {
  id: string;
  name: string;
  service: "airtime" | "data";
  network_id?: string;
  network?: string; // network name — for display only
  description: string;
  status: "active" | "inactive";
};

export type NetworkTypePayload = {
  name: string;
  service: "airtime" | "data";
  description: string;
  status: "active" | "inactive";
  network_id?: string;
};

const TYPE = "/table/network_types";

export const networkTypeService = {
  getAll: (): Promise<NetworkType[]> =>
    apiClient
      .get<ApiEnvelope<NetworkType[]>>(TYPE)
      .then((r) => r.data.data),

  create: (payload: NetworkTypePayload): Promise<NetworkType> =>
    apiClient
      .post<ApiEnvelope<NetworkType>>(TYPE, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<NetworkTypePayload>): Promise<NetworkType> =>
    apiClient
      .put<ApiEnvelope<NetworkType>>(`${TYPE}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${TYPE}/${id}`).then(() => undefined),

  toggleStatus: (type: NetworkType): Promise<NetworkType> =>
    apiClient
      .put<ApiEnvelope<NetworkType>>(`${TYPE}/${type.id}`, {
        status: type.status === "active" ? "inactive" : "active",
      })
      .then((r) => r.data.data),
};
