import { apiClient } from "@shared/api/apiClient";
import { roleService, networkTypeService, type Role, type NetworkType, type NetworkTypePayload } from "../airtime-data/service";

export { roleService, networkTypeService, type Role, type NetworkType, type NetworkTypePayload };

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// A role's charge-fee entry — always additive on top of cost_price, never a
// full replacement price (cable subscription costs are fixed by the cable
// company, not the platform). See CablePlan::getChargeFeeAmountAttribute.
export type CableChargeFeeEntry = { type: "fiat" | "percentage"; value: string | number };

export type CablePlan = {
  id: string | number;
  cable_network: string;
  plan_name: string;
  cost_price: string | number;
  // Keyed by role name (e.g. "user", "agent", "bonanza", "api").
  charge_fee?: Record<string, CableChargeFeeEntry> | null;
  charge_fee_amount?: string | number | null;
  price?: string | number | null;
  price_ngn?: string | null;
  active: boolean;
  status?: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CablePlanPayload = {
  cable_network: string;
  plan_name: string;
  cost_price: number;
  active: boolean;
  charge_fee?: Record<string, { type: "fiat" | "percentage"; value: number }> | null;
};

const CABLE_PLAN = "/table/cable_plans";

export const cablePlanService = {
  getAll: (): Promise<CablePlan[]> =>
    apiClient.get<ApiEnvelope<CablePlan[]>>(CABLE_PLAN).then((r) => r.data.data),

  getById: (id: string): Promise<CablePlan> =>
    apiClient
      .get<ApiEnvelope<CablePlan>>(`${CABLE_PLAN}/${id}`)
      .then((r) => r.data.data),

  create: (payload: CablePlanPayload): Promise<CablePlan> =>
    apiClient
      .post<ApiEnvelope<CablePlan>>(CABLE_PLAN, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<CablePlanPayload>): Promise<CablePlan> =>
    apiClient
      .put<ApiEnvelope<CablePlan>>(`${CABLE_PLAN}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${CABLE_PLAN}/${id}`).then(() => undefined),

  bulkRemove: (ids: (string | number)[]): Promise<{ deleted: number }> =>
    apiClient
      .delete<ApiEnvelope<{ deleted: number }>>(CABLE_PLAN, { data: { ids } })
      .then((r) => r.data.data),

  bulkSetActive: (ids: (string | number)[], active: boolean): Promise<CablePlan[]> =>
    apiClient
      .put<ApiEnvelope<CablePlan[]>>(`${CABLE_PLAN}/bulk`, {
        items: ids.map((id) => ({ id, active })),
      })
      .then((r) => r.data.data),
};
