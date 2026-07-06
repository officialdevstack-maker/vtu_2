import { apiClient } from "@shared/api/apiClient";
import { roleService, type Role } from "./airtime-data/service";

export { roleService, type Role };

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// A role's service-fee entry — additive on top of whatever amount the
// customer chooses to pay (electricity has no fixed catalog price, unlike
// a data/cable plan). See BillPlan::resolveServiceFee.
export type BillServiceFeeEntry = { type: "fiat" | "percentage"; value: string | number };

export type BillPlanProvider = {
  id: string | number;
  name: string;
  pivot?: {
    server_id?: string | number | null;
    provider_id?: string | number | null;
  } | null;
} | null;

export type BillPlan = {
  id: string | number;
  disco: string;
  min: string | number;
  max: string | number;
  // Keyed by role name (e.g. "user", "agent", "bonanza", "api").
  service_fee?: Record<string, BillServiceFeeEntry> | null;
  // Which vendor handles this disco, and its own numeric ID for it — no
  // cost_price here, unlike Data/CablePlan: electricity is pay-any-amount,
  // so there's nothing fixed to attribute a cost to.
  provider?: BillPlanProvider;
  use_provider_as_providerable?: boolean;
  active: boolean;
  status?: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BillPlanPayload = {
  disco: string;
  min: number;
  max: number;
  active: boolean;
  service_fee?: Record<string, { type: "fiat" | "percentage"; value: number }> | null;
  use_provider_as_providerable?: boolean;
  providerable?: {
    provider_id: string | number | null;
    server_id?: string | number | null;
  };
};

const BILL_PLAN = "/table/bill_plans";

export const billPlanService = {
  getAll: (): Promise<BillPlan[]> =>
    apiClient.get<ApiEnvelope<BillPlan[]>>(BILL_PLAN).then((r) => r.data.data),

  getById: (id: string): Promise<BillPlan> =>
    apiClient
      .get<ApiEnvelope<BillPlan>>(`${BILL_PLAN}/${id}`)
      .then((r) => r.data.data),

  create: (payload: BillPlanPayload): Promise<BillPlan> =>
    apiClient
      .post<ApiEnvelope<BillPlan>>(BILL_PLAN, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<BillPlanPayload>): Promise<BillPlan> =>
    apiClient
      .put<ApiEnvelope<BillPlan>>(`${BILL_PLAN}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${BILL_PLAN}/${id}`).then(() => undefined),

  bulkRemove: (ids: (string | number)[]): Promise<{ deleted: number }> =>
    apiClient
      .delete<ApiEnvelope<{ deleted: number }>>(BILL_PLAN, { data: { ids } })
      .then((r) => r.data.data),

  bulkSetActive: (ids: (string | number)[], active: boolean): Promise<BillPlan[]> =>
    apiClient
      .put<ApiEnvelope<BillPlan[]>>(`${BILL_PLAN}/bulk`, {
        items: ids.map((id) => ({ id, active })),
      })
      .then((r) => r.data.data),
};
