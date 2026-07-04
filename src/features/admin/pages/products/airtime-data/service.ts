import { apiClient } from "@shared/api/apiClient";

// Every JSON response is wrapped TWICE before it reaches the browser:
// 1. The global HandleRequest middleware wraps the whole response body as
//    { success, meta, data: <controller's own response body> }.
// 2. The controller's success()/fail() helper (HttpResponse trait) wraps its
//    payload as { message, success, data: <actual payload>, type }.
// So the real payload — whether a single record or a list — always sits
// three `.data` deep: r.data.data.data. Never use a shallower unwrap here.
type ApiEnvelope<T> = {
  success: boolean;
  meta: unknown;
  data: { message: string; success: boolean; data: T; type: string };
};

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
    apiClient.get<ApiEnvelope<Network[]>>(NET).then((r) => r.data.data.data),

  create: (payload: NetworkPayload): Promise<Network> =>
    apiClient
      .post<ApiEnvelope<Network>>(NET, payload)
      .then((r) => r.data.data.data),

  update: (id: string, payload: Partial<NetworkPayload>): Promise<Network> =>
    apiClient
      .put<ApiEnvelope<Network>>(`${NET}/${id}`, payload)
      .then((r) => r.data.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${NET}/${id}`).then(() => undefined),

  // No dedicated toggle endpoint — PUT the flipped status value.
  toggleStatus: (network: Network): Promise<Network> =>
    apiClient
      .put<ApiEnvelope<Network>>(`${NET}/${network.id}`, {
        status: network.status === "active" ? "inactive" : "active",
      })
      .then((r) => r.data.data.data),
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
    active?: boolean | null;
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
      .get<ApiEnvelope<NetworkType[]>>(TYPE)
      .then((r) => r.data.data.data),

  create: (payload: NetworkTypePayload): Promise<NetworkType> =>
    apiClient
      .post<ApiEnvelope<NetworkType>>(TYPE, payload)
      .then((r) => r.data.data.data),

  update: (id: string, payload: Partial<NetworkTypePayload>): Promise<NetworkType> =>
    apiClient
      .put<ApiEnvelope<NetworkType>>(`${TYPE}/${id}`, payload)
      .then((r) => r.data.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${TYPE}/${id}`).then(() => undefined),

  toggleStatus: (type: NetworkType): Promise<NetworkType> =>
    apiClient
      .put<ApiEnvelope<NetworkType>>(`${TYPE}/${type.id}`, {
        active: !type.active,
      })
      .then((r) => r.data.data.data),
};

// ─── Discount ────────────────────────────────────────────────────────────────
// Uses the Universal Table API: /table/discounts

export type Discount = {
  id: string | number;
  name: string;
  network?: string | null;
  category?: string | null;
  type?: string | null;
  min?: string | number | null;
  max?: string | number | null;
  active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DiscountPayload = {
  name: string;
  category?: string | null;
  type?: string | null;
  min?: string | number | null;
  max?: string | number | null;
  active?: boolean | null;
};

const DISCOUNT = "/table/discounts";

export const discountService = {
  getAll: (): Promise<Discount[]> =>
    apiClient
      .get<ApiEnvelope<Discount[]>>(DISCOUNT)
      .then((r) => r.data.data.data),

  getById: (id: string): Promise<Discount> =>
    apiClient
      .get<ApiEnvelope<Discount>>(`${DISCOUNT}/${id}`)
      .then((r) => r.data.data.data),

  create: (payload: DiscountPayload): Promise<Discount> =>
    apiClient
      .post<ApiEnvelope<Discount>>(DISCOUNT, payload)
      .then((r) => r.data.data.data),

  update: (id: string, payload: Partial<DiscountPayload>): Promise<Discount> =>
    apiClient
      .put<ApiEnvelope<Discount>>(`${DISCOUNT}/${id}`, payload)
      .then((r) => r.data.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${DISCOUNT}/${id}`).then(() => undefined),

  toggleStatus: (discount: Discount): Promise<Discount> =>
    apiClient
      .put<ApiEnvelope<Discount>>(`${DISCOUNT}/${discount.id}`, {
        active: !(discount.active ?? false),
      })
      .then((r) => r.data.data.data),
};

// ─── Discount role pricing ─────────────────────────────────────────────────────
// Per-role discount percentage for a given discount (network) record.
// Uses the Universal Table API: /table/discount_role

export type Role = {
  id: string | number;
  name: string;
  slug?: string;
  description?: string | null;
};

export type DiscountRolePrice = {
  id: string | number;
  discount_id: string | number;
  role_id: string | number;
  discount: string | number;
};

const DISCOUNT_ROLE = "/table/discount_role";

export const roleService = {
  // /admin/roles isn't behind the Universal Table API, so its controller
  // body shape is { success, data } rather than { message, success, data,
  // type } — still sits inside the same outer HandleRequest wrap though.
  getAll: (): Promise<Role[]> =>
    apiClient
      .get<{ success: boolean; meta: unknown; data: { success: boolean; data: Role[] } }>(
        "/admin/roles",
      )
      .then((r) => r.data.data.data),
};

export const discountRoleService = {
  getForDiscount: (discountId: string): Promise<DiscountRolePrice[]> =>
    apiClient
      .get<ApiEnvelope<DiscountRolePrice[]>>(
        `${DISCOUNT_ROLE}?discount_id=${discountId}`,
      )
      .then((r) => r.data.data.data),

  create: (payload: {
    discount_id: string | number;
    role_id: string | number;
    discount: number;
  }): Promise<DiscountRolePrice> =>
    apiClient
      .post<ApiEnvelope<DiscountRolePrice>>(DISCOUNT_ROLE, payload)
      .then((r) => r.data.data.data),

  update: (
    id: string | number,
    payload: { discount: number },
  ): Promise<DiscountRolePrice> =>
    apiClient
      .put<ApiEnvelope<DiscountRolePrice>>(`${DISCOUNT_ROLE}/${id}`, payload)
      .then((r) => r.data.data.data),
};
