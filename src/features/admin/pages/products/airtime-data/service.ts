import { apiClient } from "@shared/api/apiClient";

// Envelope returned by all API endpoints: { status, message, data }
type ApiEnvelope<T> = { status: boolean; message: string; data: T };

// List endpoints return a Laravel paginator nested inside the envelope:
// { status, message, data: { data: T[], current_page, last_page, total, ... } }
type Paginated<T> = { data: T[]; current_page: number; last_page: number; total: number };

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
      .get<ApiEnvelope<Paginated<Network>>>(NET)
      .then((r) => r.data.data.data),

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
  id: string | number;
  name: string;
  service_type: "airtime" | "data" | string;
  active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  pivot?: {
    network_id: string | number;
    network_type_id: string | number;
    service_type: "airtime" | "data" | string;
    active: boolean;
    created_at?: string | null;
    updated_at?: string | null;
  };
  provider_id?: string | number | null;
  provider?: {
    id: string | number;
    name: string;
    code?: string | null;
    balance?: string | number | null;
    connection?: boolean | null;
    username?: string | null;
    password?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    sub_category?: string | null;
  } | null;
  discount?: {
    id: string | number;
    network?: string | null;
    category?: string | null;
    type?: string | null;
    min?: string | number | null;
    max?: string | number | null;
    adex_discount?: string | number | null;
    spurs_discount?: string | number | null;
    msorg_discount?: string | number | null;
    vtpass_discount?: string | number | null;
    payscribe_discount?: string | number | null;
    isActive?: boolean | null;
  } | null;
};

export type NetworkTypePayload = {
  name: string;
  service_type: "airtime" | "data" | string;
  active?: boolean;
  provider_id?: string | number | null;
};

const TYPE = "/table/network_types";

export const networkTypeService = {
  getAll: (): Promise<NetworkType[]> =>
    apiClient
      .get<ApiEnvelope<Paginated<NetworkType>>>(TYPE)
      .then((r) => r.data.data.data),

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
        active: !type.active,
      })
      .then((r) => r.data.data),
};

// ─── Discount ────────────────────────────────────────────────────────────────
// Uses the Universal Table API: /table/discounts

export type Discount = {
  id: string | number;
  name: string;
  category?: string | null;
  type?: string | null;
  min?: string | number | null;
  max?: string | number | null;
  adex_discount?: string | number | null;
  spurs_discount?: string | number | null;
  msorg_discount?: string | number | null;
  vtpass_discount?: string | number | null;
  payscribe_discount?: string | number | null;
  isActive?: boolean | null;
  active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DiscountPayload = {
  network: string;
  category?: string | null;
  type?: string | null;
  min?: string | number | null;
  max?: string | number | null;
  adex_discount?: string | number | null;
  spurs_discount?: string | number | null;
  msorg_discount?: string | number | null;
  vtpass_discount?: string | number | null;
  payscribe_discount?: string | number | null;
  isActive?: boolean | null;
};

const DISCOUNT = "/table/discounts";

export const discountService = {
  getAll: (): Promise<Discount[]> =>
    apiClient
      .get<ApiEnvelope<Paginated<Discount>>>(DISCOUNT)
      .then((r) => r.data.data.data),

  getById: (id: string): Promise<Discount> =>
    apiClient
      .get<ApiEnvelope<Discount>>(`${DISCOUNT}/${id}`)
      .then((r) => r.data.data),

  create: (payload: DiscountPayload): Promise<Discount> =>
    apiClient
      .post<ApiEnvelope<Discount>>(DISCOUNT, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<DiscountPayload>): Promise<Discount> =>
    apiClient
      .put<ApiEnvelope<Discount>>(`${DISCOUNT}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${DISCOUNT}/${id}`).then(() => undefined),

  toggleStatus: (discount: Discount): Promise<Discount> =>
    apiClient
      .put<ApiEnvelope<Discount>>(`${DISCOUNT}/${discount.id}`, {
        isActive: !(discount.isActive ?? discount.active ?? false),
      })
      .then((r) => r.data.data),
};
