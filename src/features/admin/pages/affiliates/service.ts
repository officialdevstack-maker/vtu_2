import { apiClient } from "@shared/api/apiClient";
import { DEFAULT_PAGE_SIZE } from "@shared/pagination";

// The real payload sits exactly one `.data` deep: r.data.data (see
// backend/app/Http/Middleware/HandleRequest.php).
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type PaginatedMeta = {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  from: number | null;
  to: number | null;
};

type PaginatedApiEnvelope<T> = ApiEnvelope<T> & { meta: PaginatedMeta };

export type TableQueryParams = {
  query?: string;
  sort?: string;
  page?: number;
  per_page?: number;
  [key: string]: string | number | undefined;
};

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
  invite_sent: boolean;
  directive_id: string | number;
  wallet_balance_at_migration: number;
};

export type ChildCustomerMessage = {
  id: string | number;
  child_customer_id: string | number;
  sent_by: string | number | null;
  subject: string;
  body: string;
  created_at?: string | null;
  sender?: { id: string | number; username: string } | null;
};

export const childCustomerService = {
  getByInstance: (instanceId: string | number): Promise<ChildCustomer[]> =>
    apiClient
      .get<ApiEnvelope<ChildCustomer[]>>(CUSTOMERS, { params: { child_instance_id: instanceId } })
      .then((r) => r.data.data),

  getPaginatedByInstance: (
    instanceId: string | number,
    params: TableQueryParams,
  ): Promise<{ data: ChildCustomer[]; meta: PaginatedMeta }> =>
    apiClient
      .get<PaginatedApiEnvelope<ChildCustomer[]>>(CUSTOMERS, {
        params: { child_instance_id: instanceId, per_page: DEFAULT_PAGE_SIZE, ...params },
      })
      .then((r) => ({ data: r.data.data, meta: r.data.meta })),

  // The "promote to real account" action: creates a parent User (or links an
  // existing one on email/phone match), stamps migrated_to_user_id, auto-queues
  // a redirect_user directive, and transfers the customer's child wallet
  // balance into the parent account.
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

  // One-off emails to this customer via the parent's own mail infra, with a
  // persisted outbound log (replies land in the admin's inbox, not here).
  // Subject/body support {{ user.username }}-style placeholders.
  getMessages: (
    instanceId: string | number,
    customerId: string | number,
  ): Promise<ChildCustomerMessage[]> =>
    apiClient
      .get<ApiEnvelope<ChildCustomerMessage[]>>(
        `/admin/child-instances/${instanceId}/customers/${customerId}/messages`,
      )
      .then((r) => r.data.data),

  sendMessage: (
    instanceId: string | number,
    customerId: string | number,
    subject: string,
    body: string,
  ): Promise<ChildCustomerMessage> =>
    apiClient
      .post<ApiEnvelope<ChildCustomerMessage>>(
        `/admin/child-instances/${instanceId}/customers/${customerId}/messages`,
        { subject, body },
      )
      .then((r) => r.data.data),
};

// Rides the existing admin broadcast engine with the child_customers
// audience mode (email-only — child customers have no login here for in-app,
// and SMS is reserved for our own users).
export const childBroadcastService = {
  countEmailable: (instanceId: string | number): Promise<number> =>
    apiClient
      .post<ApiEnvelope<{ count: number }>>(`/admin/broadcast/audience-count`, {
        audience_mode: "child_customers",
        child_instance_id: instanceId,
      })
      .then((r) => r.data.data.count),

  emailAll: (
    instanceId: string | number,
    subject: string,
    body: string,
  ): Promise<number> =>
    apiClient
      .post<ApiEnvelope<{ notified: number }>>(`/admin/broadcast`, {
        audience_mode: "child_customers",
        child_instance_id: instanceId,
        channels: ["Email"],
        emailSubject: subject,
        emailBody: body,
        sendNow: true,
        priorityHigh: false,
      })
      .then((r) => r.data.data.notified),
};

export const childTransactionService = {
  getByInstance: (instanceId: string | number): Promise<ChildTransaction[]> =>
    apiClient
      .get<ApiEnvelope<ChildTransaction[]>>(TRANSACTIONS, { params: { child_instance_id: instanceId } })
      .then((r) => r.data.data),

  getPaginatedByInstance: (
    instanceId: string | number,
    params: TableQueryParams,
  ): Promise<{ data: ChildTransaction[]; meta: PaginatedMeta }> =>
    apiClient
      .get<PaginatedApiEnvelope<ChildTransaction[]>>(TRANSACTIONS, {
        params: { child_instance_id: instanceId, per_page: DEFAULT_PAGE_SIZE, ...params },
      })
      .then((r) => ({ data: r.data.data, meta: r.data.meta })),
};

export type DirectiveType =
  | "message"
  | "redirect_user"
  | "redirect_all_users"
  | "reroute_provider"
  | "update_settings"
  | "retry_transaction"
  | "custom";

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

// ─── Remote controls ────────────────────────────────────────────────────────
// The desired state the parent last pushed, persisted in
// child_instances.config.controls so the Controls page survives reloads.
// This is what we ASKED the child to do — whether it actually applied is
// only visible through the matching directive's delivered/pending status
// (the child polls every ~5 minutes and never reports its live values back).

export type ProviderRouteSlot = "1" | "2" | "3";

// Column names in the child app's `settings` table (adex_maditel) — the
// update_settings directive writes them verbatim, so these keys must match.
export type ProcessFlagKey =
  | "is_verify_email"
  | "flutterwave"
  | "monnify"
  | "monnify_atm"
  | "wema"
  | "earning"
  | "referral";

export type AffiliateControlsState = {
  redirect_all?: { enabled: boolean; target_url: string; updated_at: string };
  provider_routes?: Partial<
    Record<ProviderRouteSlot, { website_url: string; username?: string; updated_at: string }>
  >;
  process_flags?: { values: Partial<Record<ProcessFlagKey, boolean>>; updated_at: string };
};

export const getControls = (instance: ChildInstance | null): AffiliateControlsState =>
  ((instance?.config as { controls?: AffiliateControlsState } | null)?.controls) ?? {};

export const affiliateControlsService = {
  // Merge-write: keeps whatever else lives in config (the child's own
  // registration metadata etc.) and only replaces the controls key.
  save: (instance: ChildInstance, controls: AffiliateControlsState): Promise<ChildInstance> =>
    apiClient
      .put<ApiEnvelope<ChildInstance>>(`${INSTANCES}/${instance.id}`, {
        config: { ...(instance.config ?? {}), controls },
      })
      .then((r) => r.data.data),
};

// Outbound email log across every customer of one affiliate. Messages are
// keyed by child_customer_id only, so we pull them with their customer and
// filter to this instance client-side (volumes here are one-off admin
// emails, not a firehose).
export type ChildCustomerMessageWithCustomer = ChildCustomerMessage & {
  child_customer?: (ChildCustomer & { child_instance_id: string | number }) | null;
  childCustomer?: (ChildCustomer & { child_instance_id: string | number }) | null;
};

export const childMessageService = {
  getForInstance: (instanceId: string | number): Promise<ChildCustomerMessageWithCustomer[]> =>
    apiClient
      .get<ApiEnvelope<ChildCustomerMessageWithCustomer[]>>("/table/child_customer_messages", {
        params: { with: "sender,childCustomer", sort: "created_at,desc" },
      })
      .then((r) =>
        r.data.data.filter((m) => {
          const customer = m.child_customer ?? m.childCustomer;
          return customer && String(customer.child_instance_id) === String(instanceId);
        }),
      ),
};
