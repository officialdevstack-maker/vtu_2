import { apiClient } from "@shared/api/apiClient";

// Uses /admin/templates — see API_DOCUMENTATION.md section 15.

export type TemplateType = "event" | "broadcast";
export type TemplateEvent = "login" | "register" | "purchase" | "wallet_credit" | "wallet_debit";
export type TemplateChannel = "email" | "sms" | "in_app" | "push";

export type Template = {
  id: number;
  name: string;
  slug: string;
  type: TemplateType;
  event: TemplateEvent | null;
  subject: string | null;
  content: string;
  channels: TemplateChannel[];
  enabled: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
};

export type TemplatePayload = {
  name: string;
  slug?: string;
  type: TemplateType;
  event?: TemplateEvent | null;
  subject?: string | null;
  content: string;
  channels?: TemplateChannel[];
  enabled?: boolean;
};

export type TemplateFilters = {
  type?: TemplateType;
  event?: TemplateEvent;
  enabled?: boolean;
};

// The real payload sits exactly one `.data` deep: r.data.data (see
// backend/app/Http/Middleware/HandleRequest.php).
type TemplateEnvelope<T> = { success: boolean; message?: string; data: T };

// A supported placeholder from the backend catalog (App\Support\TemplateVariables).
export type TemplateVariable = { name: string; token: string; description: string };

export type TemplateVariableCatalog = {
  global: TemplateVariable[];
  events: Record<TemplateEvent, TemplateVariable[]>;
  note: string;
};

const BASE = "/admin/templates";

export const templateService = {
  getAll: (filters?: TemplateFilters): Promise<Template[]> =>
    apiClient
      .get<TemplateEnvelope<Template[]>>(BASE, { params: filters })
      .then((r) => r.data.data ?? []),

  // The catalog of supported {{variables}} — global plus per event.
  getVariables: (): Promise<TemplateVariableCatalog> =>
    apiClient
      .get<TemplateEnvelope<TemplateVariableCatalog>>(`${BASE}/variables`)
      .then((r) => r.data.data),

  getById: (id: string | number): Promise<Template> =>
    apiClient.get<TemplateEnvelope<Template>>(`${BASE}/${id}`).then((r) => r.data.data),

  create: (payload: TemplatePayload): Promise<Template> =>
    apiClient.post<TemplateEnvelope<Template>>(BASE, payload).then((r) => r.data.data),

  update: (id: string | number, payload: Partial<TemplatePayload>): Promise<Template> =>
    apiClient.put<TemplateEnvelope<Template>>(`${BASE}/${id}`, payload).then((r) => r.data.data),

  remove: (id: string | number): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`).then(() => undefined),
};

// ─── Broadcast (BroadcastController) ─────────────────────────────────────────
// Sends a one-off message to a fully customizable audience — either a
// specific list of individuals, or "criteria" mode combining any of: real
// role, signup recency, wallet balance range, transaction count/volume
// range, and referral count range (all AND-combined; see
// BroadcastController::resolveAudience). Delivered over any combination of
// channels, personalized per recipient via `{{user.fullname}}` /
// `{{user.username}}` / `{{user.email}}` placeholders (see
// App\Classes\TemplateParser). "Email"/"sms" delivery is queued
// (App\Notifications\BroadcastNotification implements ShouldQueue) —
// requires `php artisan queue:listen` running, which `composer run dev`
// already starts alongside the server. Scheduled sends (sendNow: false) are
// picked up by the broadcasts:send-scheduled command (runs every minute,
// see routes/console.php).

export type BroadcastChannel = "Email" | "sms" | "database";
export type AudienceMode = "criteria" | "individuals";

export type AudienceFilters = {
  audience_mode: AudienceMode;
  user_ids?: number[];
  role_ids?: number[];
  signed_up_within_days?: number | null;
  wallet_balance_min?: number | null;
  wallet_balance_max?: number | null;
  transaction_count_min?: number | null;
  transaction_count_max?: number | null;
  transaction_amount_min?: number | null;
  transaction_amount_max?: number | null;
  referral_count_min?: number | null;
  referral_count_max?: number | null;
};

export type BroadcastPayload = AudienceFilters & {
  name?: string;
  channels: BroadcastChannel[];
  smsMessage?: string;
  emailSubject?: string;
  emailBody?: string;
  notifTitle?: string;
  notifMessage?: string;
  sendNow: boolean;
  scheduleDate?: string | null;
  priorityHigh: boolean;
};

export type BroadcastResult = { notified: number; recipient_count?: number };

export type BroadcastHistoryItem = {
  id: number;
  name: string | null;
  title: string | null;
  message: string | null;
  channels: BroadcastChannel[];
  payload?: Partial<BroadcastPayload> | null;
  audience_label: string | null;
  recipient_count: number;
  scheduled_at: string | null;
  sent: boolean;
  created_at: string;
};

export type BroadcastUserSearchResult = { id: number; username: string; fullname: string; email: string };

const BROADCAST_BASE = "/admin/broadcast";

export const broadcastService = {
  send: (payload: BroadcastPayload): Promise<BroadcastResult> =>
    apiClient.post<TemplateEnvelope<BroadcastResult>>(BROADCAST_BASE, payload).then((r) => r.data.data),

  getAudienceCount: (filters: AudienceFilters): Promise<number> =>
    apiClient
      .post<TemplateEnvelope<{ count: number }>>(`${BROADCAST_BASE}/audience-count`, filters)
      .then((r) => r.data.data.count),

  searchUsers: (q: string): Promise<BroadcastUserSearchResult[]> =>
    apiClient
      .get<TemplateEnvelope<BroadcastUserSearchResult[]>>(`${BROADCAST_BASE}/users-search`, { params: { q } })
      .then((r) => r.data.data),

  getHistory: (): Promise<BroadcastHistoryItem[]> =>
    apiClient.get<TemplateEnvelope<BroadcastHistoryItem[]>>(`${BROADCAST_BASE}/history`).then((r) => r.data.data),
};
