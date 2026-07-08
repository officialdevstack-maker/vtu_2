import { apiClient } from "@shared/api/apiClient";

// The real payload sits exactly one `.data` deep: r.data.data (see
// backend/app/Http/Middleware/HandleRequest.php).
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// "pending" = registration code generated but the child hasn't completed
// self-registration yet (no shared_secret exists server-side until then).
export type ChildInstanceStatus = "pending" | "active" | "paused" | "revoked";

export type ChildInstance = {
  id: string | number;
  name: string;
  slug: string;
  base_url: string | null;
  status: ChildInstanceStatus;
  last_seen_at: string | null;
  registered_at?: string | null;
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

export type RegistrationCode = {
  id: string | number;
  name: string;
  registration_code: string;
  expires_at: string;
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

  // No manual create form — an admin only ever provides a name and gets a
  // one-time registration code back; the child turns that into its own
  // real slug/secret via POST /api/child/register the first time it
  // connects (see child_backend's ParentSyncRegister command).
  generateCode: (name: string): Promise<RegistrationCode> =>
    apiClient
      .post<ApiEnvelope<RegistrationCode>>(`/admin/child-instances/generate-code`, { name })
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<ChildInstancePayload>): Promise<ChildInstance> =>
    apiClient
      .put<ApiEnvelope<ChildInstance>>(`${INSTANCES}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${INSTANCES}/${id}`).then(() => undefined),

  // Reuses the generic Universal Table CRUD's bulk path (AdminController::
  // universalBulkCreateOrUpdate) rather than a dedicated endpoint — it
  // already does exactly this (id-matched partial column updates), and a
  // status-only bulk change doesn't need anything more specific.
  bulkUpdateStatus: (ids: (string | number)[], status: ChildInstanceStatus): Promise<void> =>
    apiClient
      .post(INSTANCES, { items: ids.map((id) => ({ id, status })) })
      .then(() => undefined),

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

export type MigrationResult = {
  user: { id: string | number; username: string; email: string; phone: string };
  linked_existing: boolean;
  directive_id: string | number;
  wallet_balance_at_migration: number;
};

export const childCustomerService = {
  getByInstance: (instanceId: string | number): Promise<ChildCustomer[]> =>
    apiClient
      .get<ApiEnvelope<ChildCustomer[]>>(CUSTOMERS, { params: { child_instance_id: instanceId } })
      .then((r) => r.data.data),

  // The "promote to real account" action: creates a parent User (or links an
  // existing one on email/phone match), stamps migrated_to_user_id, and
  // auto-queues a redirect_user directive. The customer's child wallet
  // balance is deliberately NOT credited — see ChildCustomerMigrationController.
  migrate: (
    instanceId: string | number,
    customerId: string | number,
    targetUrl?: string,
  ): Promise<MigrationResult> =>
    apiClient
      .post<ApiEnvelope<MigrationResult>>(
        `/admin/child-instances/${instanceId}/customers/${customerId}/migrate`,
        targetUrl ? { target_url: targetUrl } : {},
      )
      .then((r) => r.data.data),
};

export const childTransactionService = {
  getByInstance: (instanceId: string | number): Promise<ChildTransaction[]> =>
    apiClient
      .get<ApiEnvelope<ChildTransaction[]>>(TRANSACTIONS, { params: { child_instance_id: instanceId } })
      .then((r) => r.data.data),
};

export type DirectiveType = "message" | "redirect_user" | "retry_transaction" | "custom";

export const childDirectiveService = {
  getByInstance: (instanceId: string | number): Promise<ChildDirective[]> =>
    apiClient
      .get<ApiEnvelope<ChildDirective[]>>(DIRECTIVES, { params: { child_instance_id: instanceId } })
      .then((r) => r.data.data),

  // Deliberately not the generic /table/child_directives write path — its
  // create routes all require an id up front (they're update-by-id
  // endpoints), so there's no generic "create new row" primitive to reuse
  // here. See AdminController::createChildDirective.
  create: (instanceId: string | number, type: string, payload: Record<string, unknown>): Promise<ChildDirective> =>
    apiClient
      .post<ApiEnvelope<ChildDirective>>(`/admin/child-instances/${instanceId}/directives`, { type, payload })
      .then((r) => r.data.data),
};
