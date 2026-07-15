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
  // Airtime-to-cash config for this network — the number customers transfer
  // airtime to, the amount range accepted, and whether it's enabled for
  // conversion at all. See App\Models\Network / AirtimeToCashController.
  airtime_to_cash_destination_number?: string | null;
  airtime_to_cash_min?: string | number | null;
  airtime_to_cash_max?: string | number | null;
  airtime_to_cash_active?: boolean;
};

export type NetworkPayload = Omit<Network, "id">;

const NET = "/table/networks";

// The `networks` table stores an `active` boolean; the UI speaks in
// "status" ("active"/"inactive"). Translate on write so the value actually
// persists (the Universal Table API drops the non-column `status` key), and
// let the backend's `status` accessor supply it back on read.
const toNetworkWrite = (
  payload: Partial<NetworkPayload>,
): Record<string, unknown> => {
  const { status, ...rest } = payload;
  return status === undefined
    ? rest
    : { ...rest, active: status === "active" };
};

export const networkService = {
  getAll: (): Promise<Network[]> =>
    apiClient.get<ApiEnvelope<Network[]>>(NET).then((r) => r.data.data),

  create: (payload: NetworkPayload): Promise<Network> =>
    apiClient
      .post<ApiEnvelope<Network>>(NET, toNetworkWrite(payload))
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<NetworkPayload>): Promise<Network> =>
    apiClient
      .put<ApiEnvelope<Network>>(`${NET}/${id}`, toNetworkWrite(payload))
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${NET}/${id}`).then(() => undefined),

  // No dedicated toggle endpoint — PUT the flipped active flag.
  toggleStatus: (network: Network): Promise<Network> =>
    apiClient
      .put<ApiEnvelope<Network>>(`${NET}/${network.id}`, {
        active: network.status !== "active",
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
    discount_type?: string | null;
    value?: string | number | null;
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

// ─── Airtime plan ───────────────────────────────────────────────────────────
// Per-network airtime config (min/max transaction amount, active toggle) —
// distinct from the Discount feature under Growth & Marketing (a scheduled
// flash-sale price cut). This used to live on the `discounts` table before
// that got repurposed for Discount; it's its own `airtime_plans` table now
// so the two stop colliding. Uses the Universal Table API: /table/airtime_plans

export type AirtimePlan = {
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
  // Provider association (same `providerables` pivot as data plans) — which
  // vendor/server this network's airtime maps to.
  provider_id?: string | number | null;
  server_id?: string | number | null;
  cost_price?: string | number | null;
  provider?: DataPlanProvider;
  fallback_provider_id?: string | number | null;
  fallback_server_id?: string | number | null;
  fallback_cost_price?: string | number | null;
  fallback_provider?: DataPlanProvider;
  use_provider_as_providerable?: boolean | null;
};

export type AirtimePlanPayload = {
  name: string;
  category?: string | null;
  type?: string | null;
  min?: string | number | null;
  max?: string | number | null;
  active?: boolean | null;
  use_provider_as_providerable?: boolean;
  providerable?: {
    provider_id: string | number | null;
    cost_price?: number;
    server_id?: string | number | null;
    fallback_provider_id?: string | number | null;
    fallback_server_id?: string | number | null;
    fallback_cost_price?: string | number | null;
  };
};

const AIRTIME_PLAN = "/table/airtime_plans";

export const airtimePlanService = {
  getAll: (): Promise<AirtimePlan[]> =>
    apiClient.get<ApiEnvelope<AirtimePlan[]>>(AIRTIME_PLAN).then((r) => r.data.data),

  getById: (id: string): Promise<AirtimePlan> =>
    apiClient
      .get<ApiEnvelope<AirtimePlan>>(`${AIRTIME_PLAN}/${id}`)
      .then((r) => r.data.data),

  create: (payload: AirtimePlanPayload): Promise<AirtimePlan> =>
    apiClient
      .post<ApiEnvelope<AirtimePlan>>(AIRTIME_PLAN, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<AirtimePlanPayload>): Promise<AirtimePlan> =>
    apiClient
      .put<ApiEnvelope<AirtimePlan>>(`${AIRTIME_PLAN}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${AIRTIME_PLAN}/${id}`).then(() => undefined),

  toggleStatus: (plan: AirtimePlan): Promise<AirtimePlan> =>
    apiClient
      .put<ApiEnvelope<AirtimePlan>>(`${AIRTIME_PLAN}/${plan.id}`, {
        active: !(plan.active ?? false),
      })
      .then((r) => r.data.data),
};

// ─── Role ───────────────────────────────────────────────────────────────────
// Shared by data plan pricing (below).

export type Role = {
  id: string | number;
  name: string;
  slug?: string;
  description?: string | null;
};

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
  // True for a plan auto-created by a vendor plan sync (e.g.
  // Ogdams::syncPlans()) that hasn't been reviewed/priced by an admin yet —
  // distinct from `active: false`, which also covers plans an admin
  // deliberately turned off.
  is_draft?: boolean;
  status?: string;
  sort_order?: number | string | null;
  // Keyed by role name (e.g. "user", "agent", "customer care").
  pricing?: Record<string, DataPlanPriceEntry> | null;
  price?: string | number | null;
  price_ngn?: string | null;
  cost_price?: string | number | null;
  server_id?: string | number | null;
  provider_id?: string | number | null;
  fallback_provider_id?: string | number | null;
  fallback_server_id?: string | number | null;
  fallback_cost_price?: string | number | null;
  fallback_provider?: DataPlanProvider;
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
    fallback_provider_id?: string | number | null;
    fallback_server_id?: string | number | null;
    fallback_cost_price?: string | number | null;
  };
};

const DATA_PLAN = "/table/data_plans";

// The bulk endpoint processes every item inside a single DB transaction, so
// a few hundred rows in one request can hit request/gateway timeouts — and
// because it's all-or-nothing, a timeout means nothing changes at all. Send
// large selections in sequential chunks instead so each request stays small
// and progress is committed batch by batch.
const BULK_CHUNK_SIZE = 100;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

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

  // AdminController::universalBulkDelete expects { ids: [...] }.
  // Chunked so a large selection doesn't hit a timeout on the single-
  // transaction endpoint.
  bulkRemove: async (ids: (string | number)[]): Promise<{ deleted: number }> => {
    let deleted = 0;
    for (const batch of chunk(ids, BULK_CHUNK_SIZE)) {
      const r = await apiClient.delete<ApiEnvelope<{ deleted: number }>>(
        DATA_PLAN,
        { data: { ids: batch } },
      );
      deleted += r.data.data?.deleted ?? batch.length;
    }
    return { deleted };
  },

  // AdminController::universalBulkCreateOrUpdate expects { items: [{id, ...changes}] }.
  // Chunked so activating/deactivating hundreds of plans is committed in
  // batches rather than one all-or-nothing request that can time out.
  bulkSetActive: async (
    ids: (string | number)[],
    active: boolean,
  ): Promise<DataPlan[]> => {
    const updated: DataPlan[] = [];
    for (const batch of chunk(ids, BULK_CHUNK_SIZE)) {
      const r = await apiClient.put<ApiEnvelope<DataPlan[]>>(
        `${DATA_PLAN}/bulk`,
        { items: batch.map((id) => ({ id, active })) },
      );
      if (Array.isArray(r.data.data)) updated.push(...r.data.data);
    }
    return updated;
  },
};
