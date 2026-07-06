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

const BASE = "/admin/templates";

export const templateService = {
  getAll: (filters?: TemplateFilters): Promise<Template[]> =>
    apiClient
      .get<TemplateEnvelope<Template[]>>(BASE, { params: filters })
      .then((r) => r.data.data ?? []),

  getById: (id: string | number): Promise<Template> =>
    apiClient.get<TemplateEnvelope<Template>>(`${BASE}/${id}`).then((r) => r.data.data),

  create: (payload: TemplatePayload): Promise<Template> =>
    apiClient.post<TemplateEnvelope<Template>>(BASE, payload).then((r) => r.data.data),

  update: (id: string | number, payload: Partial<TemplatePayload>): Promise<Template> =>
    apiClient.put<TemplateEnvelope<Template>>(`${BASE}/${id}`, payload).then((r) => r.data.data),

  remove: (id: string | number): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`).then(() => undefined),
};

// ─── Broadcast (AdminController::broadcast) ──────────────────────────────────
// Sends a one-off message to every user of the selected type(s), over any
// combination of channels. `{{user.fullname}}` / `{{user.username}}` /
// `{{user.email}}` placeholders in any text field are substituted per
// recipient server-side (see App\Classes\TemplateParser). Delivery for
// "Email"/"sms" is queued (App\Notifications\BroadcastNotification
// implements ShouldQueue) — requires `php artisan queue:listen` running,
// which `composer run dev` already starts alongside the server.

export type BroadcastRecipientType = "user" | "agent" | "api" | "admin" | "bonanza";
export type BroadcastChannel = "Email" | "sms" | "database";

export type BroadcastPayload = {
  channels: BroadcastChannel[];
  recipients: BroadcastRecipientType[];
  smsMessage?: string;
  emailSubject?: string;
  emailBody?: string;
  notifTitle?: string;
  notifMessage?: string;
  sendNow: boolean;
  scheduleDate?: string | null;
  priorityHigh: boolean;
};

export type BroadcastResult = { notified: number };

export type BroadcastHistoryItem = {
  id: number;
  title: string | null;
  message: string | null;
  channels: BroadcastChannel[];
  audience_label: string | null;
  scheduled_at: string | null;
  sent: boolean;
  created_at: string;
};

const BROADCAST_BASE = "/admin/broadcast";
const BROADCAST_HISTORY = "/table/broadcasts";

export const broadcastService = {
  send: (payload: BroadcastPayload): Promise<BroadcastResult> =>
    apiClient.post<TemplateEnvelope<BroadcastResult>>(BROADCAST_BASE, payload).then((r) => r.data.data),

  getHistory: (): Promise<BroadcastHistoryItem[]> =>
    apiClient.get<TemplateEnvelope<BroadcastHistoryItem[]>>(BROADCAST_HISTORY).then((r) => r.data.data),
};
