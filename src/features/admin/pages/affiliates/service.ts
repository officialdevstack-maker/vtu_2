import { apiClient } from "@shared/api/apiClient";

// The real payload sits exactly one `.data` deep: r.data.data (see
// backend/app/Http/Middleware/HandleRequest.php).
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type ChildInstanceStatus = "active" | "paused" | "revoked";

export type ChildInstance = {
  id: string | number;
  name: string;
  slug: string;
  base_url: string | null;
  status: ChildInstanceStatus;
  last_seen_at: string | null;
  health_status: string | null;
  config: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ChildInstancePayload = {
  name: string;
  base_url?: string | null;
  status?: ChildInstanceStatus;
};

export type ChildCustomer = {
  id: string | number;
  child_instance_id: string | number;
  external_id: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  wallet_balance: string | number;
  status: string | null;
  migrated_to_user_id: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ChildTransaction = {
  id: string | number;
  child_instance_id: string | number;
  child_customer_id: string | number | null;
  external_id: string;
  transaction_type: string | null;
  amount: string | number;
  status: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ChildDirective = {
  id: string | number;
  child_instance_id: string | number;
  type: string;
  payload: Record<string, unknown> | null;
  status: "pending" | "delivered" | "failed";
  delivered_at: string | null;
  created_at?: string | null;
};

const INSTANCES = "/table/child_instances";
const CUSTOMERS = "/table/child_customers";
const TRANSACTIONS = "/table/child_transactions";
const DIRECTIVES = "/table/child_directives";

export const childInstanceService = {
  getAll: (): Promise<ChildInstance[]> =>
    apiClient.get<ApiEnvelope<ChildInstance[]>>(INSTANCES).then((r) => r.data.data),

  getById: (id: string): Promise<ChildInstance> =>
    apiClient
      .get<ApiEnvelope<ChildInstance>>(`${INSTANCES}/${id}`)
      .then((r) => r.data.data),

  create: (payload: ChildInstancePayload): Promise<ChildInstance> =>
    apiClient
      .post<ApiEnvelope<ChildInstance>>(INSTANCES, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<ChildInstancePayload>): Promise<ChildInstance> =>
    apiClient
      .put<ApiEnvelope<ChildInstance>>(`${INSTANCES}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${INSTANCES}/${id}`).then(() => undefined),

  // shared_secret is $hidden on the model — these are the only two ways to
  // ever see it (view once, or rotate and see the new value once).
  getSecret: (id: string): Promise<string> =>
    apiClient
      .get<ApiEnvelope<{ secret: string }>>(`/admin/child-instances/${id}/secret`)
      .then((r) => r.data.data.secret),

  regenerateSecret: (id: string): Promise<string> =>
    apiClient
      .post<ApiEnvelope<{ secret: string }>>(`/admin/child-instances/${id}/regenerate-secret`)
      .then((r) => r.data.data.secret),
};

export const childCustomerService = {
  getByInstance: (instanceId: string | number): Promise<ChildCustomer[]> =>
    apiClient
      .get<ApiEnvelope<ChildCustomer[]>>(CUSTOMERS, { params: { child_instance_id: instanceId } })
      .then((r) => r.data.data),
};

export const childTransactionService = {
  getByInstance: (instanceId: string | number): Promise<ChildTransaction[]> =>
    apiClient
      .get<ApiEnvelope<ChildTransaction[]>>(TRANSACTIONS, { params: { child_instance_id: instanceId } })
      .then((r) => r.data.data),
};

export const childDirectiveService = {
  getByInstance: (instanceId: string | number): Promise<ChildDirective[]> =>
    apiClient
      .get<ApiEnvelope<ChildDirective[]>>(DIRECTIVES, { params: { child_instance_id: instanceId } })
      .then((r) => r.data.data),
};
