import { apiClient } from "@shared/api/apiClient";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };
export type PaginatedMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};
type PaginatedApiEnvelope<T> = ApiEnvelope<T> & { meta: PaginatedMeta };

// A Laravel database notification row (Illuminate\Notifications\Notifiable +
// the `notifications` table already shipped with this app) — `id` is a
// UUID, not an auto-increment int. `data.type` is the free-form event key
// App\Notifications\AppNotification stores (e.g. "transaction_success",
// "wallet_transfer_in", "airtime_to_cash_approved") — used client-side to
// pick an icon, see notificationDisplay.ts.
export type AppNotification = {
  id: string;
  data: { type: string; title: string; body: string; [key: string]: unknown };
  read_at: string | null;
  created_at: string;
};

export const notificationService = {
  getAll: (page = 1, perPage = 10): Promise<{ data: AppNotification[]; meta: PaginatedMeta }> =>
    apiClient
      .get<PaginatedApiEnvelope<AppNotification[]>>("/notifications", {
        params: { page, per_page: perPage },
      })
      .then((r) => ({ data: r.data.data, meta: r.data.meta })),

  getUnreadCount: (): Promise<number> =>
    apiClient
      .get<ApiEnvelope<{ count: number }>>("/notifications/unread-count")
      .then((r) => r.data.data.count),

  markRead: (id: string): Promise<void> =>
    apiClient.post(`/notifications/${id}/read`).then(() => undefined),

  markAllRead: (): Promise<void> =>
    apiClient.post("/notifications/read-all").then(() => undefined),
};
