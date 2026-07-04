import { apiClient } from "@shared/api/apiClient";

// Every JSON response is wrapped once before it reaches the browser, by the
// global HandleRequest middleware, which merges its own `meta` into the
// controller's own response body: { message, success, data: <payload>, type,
// meta }. So the real payload — single record or list alike — always sits
// exactly one `.data` deep: r.data.data.
type ApiEnvelope<T> = {
  message: string;
  success: boolean;
  data: T;
  type: string;
  meta: unknown;
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
    apiClient.get<ApiEnvelope<Network[]>>(NET).then((r) => r.data.data),

  create: (payload: NetworkPayload): Promise<Network> =>
    apiClient.post<ApiEnvelope<Network>>(NET, payload).then((r) => r.data.data),

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
    apiClient.get<ApiEnvelope<NetworkType[]>>(TYPE).then((r) => r.data.data),

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
    apiClient.get<ApiEnvelope<Discount[]>>(DISCOUNT).then((r) => r.data.data),

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
        active: !(discount.active ?? false),
      })
      .then((r) => r.data.data),
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
  // /admin/roles isn't behind the Universal Table API — its controller body
  // is { success, data } rather than { message, success, data, type } — but
  // it still passes through the same HandleRequest merge, so the real array
  // still sits exactly one `.data` deep.
  getAll: (): Promise<Role[]> =>
    apiClient
      .get<{ success: boolean; data: Role[]; meta: unknown }>("/admin/roles")
      .then((r) => r.data.data),
};

export const discountRoleService = {
  getForDiscount: (discountId: string): Promise<DiscountRolePrice[]> =>
    apiClient
      .get<ApiEnvelope<DiscountRolePrice[]>>(
        `${DISCOUNT_ROLE}?discount_id=${discountId}`,
      )
      .then((r) => r.data.data),

  create: (payload: {
    discount_id: string | number;
    role_id: string | number;
    discount: number;
  }): Promise<DiscountRolePrice> =>
    apiClient
      .post<ApiEnvelope<DiscountRolePrice>>(DISCOUNT_ROLE, payload)
      .then((r) => r.data.data),

  update: (
    id: string | number,
    payload: { discount: number },
  ): Promise<DiscountRolePrice> =>
    apiClient
      .put<ApiEnvelope<DiscountRolePrice>>(`${DISCOUNT_ROLE}/${id}`, payload)
      .then((r) => r.data.data),
};

// ─── Data plan ──────────────────────────────────────────────────────────────
// Uses the Universal Table API: /table/data_plans

export type DataPlanProvider = {
  id: string | number;
  name: string;
  pivot?: {
    cost_price?: string | number | null;
    server_id?: string | number | null;
    provider_id?: string | number | null;
  } | null;
} | null;

// A role's pricing entry: either a plain legacy fiat number, or the new
// { type, value } shape — "percentage" is a markup over the plan's cost
// price (see DataPlan::getPriceAttribute() / resolveCostPrice() backend-side).
export type DataPlanPriceEntry =
  | string
  | number
  | { type: "fiat" | "percentage"; value: string | number };

export type DataPlan = {
  id: string | number;
  network: string;
  plan_name: string; // numeric amount, e.g. "1"
  plan_size: string; // unit, e.g. "GB" | "MB"
  plan_type: string; // e.g. "sme"
  plan?: string; // computed "1GB"
  validity: string;
  active: boolean;
  status?: string;
  sort_order?: number | string | null;
  // Keyed by role name (e.g. "user", "agent", "customer care").
  pricing?: Record<string, DataPlanPriceEntry> | null;
  price?: string | number | null;
  price_ngn?: string | null;
  cost_price?: string | number | null;
  server_id?: string | number | null;
  provider_id?: string | number | null;
  provider?: DataPlanProvider;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DataPlanPayload = {
  network: string;
  plan_name: string;
  plan_size: string;
  plan_type: string;
  validity: string;
  active: boolean;
  sort_order?: number | null;
  pricing?: Record<string, { type: "fiat" | "percentage"; value: number }> | null;
  use_provider_as_providerable?: boolean;
  providerable?: {
    provider_id: string | number | null;
    cost_price?: number;
    server_id?: string | number | null;
  };
};

const DATA_PLAN = "/table/data_plans";

export const dataPlanService = {
  getAll: (): Promise<DataPlan[]> =>
    apiClient.get<ApiEnvelope<DataPlan[]>>(DATA_PLAN).then((r) => r.data.data),

  getById: (id: string): Promise<DataPlan> =>
    apiClient
      .get<ApiEnvelope<DataPlan>>(`${DATA_PLAN}/${id}`)
      .then((r) => r.data.data),

  create: (payload: DataPlanPayload): Promise<DataPlan> =>
    apiClient
      .post<ApiEnvelope<DataPlan>>(DATA_PLAN, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<DataPlanPayload>): Promise<DataPlan> =>
    apiClient
      .put<ApiEnvelope<DataPlan>>(`${DATA_PLAN}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${DATA_PLAN}/${id}`).then(() => undefined),

  toggleStatus: (plan: DataPlan): Promise<DataPlan> =>
    apiClient
      .put<ApiEnvelope<DataPlan>>(`${DATA_PLAN}/${plan.id}`, {
        active: !plan.active,
      })
      .then((r) => r.data.data),
};
