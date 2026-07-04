import { apiClient } from "@shared/api/apiClient";

// The real payload sits exactly one `.data` deep: r.data.data (see
// backend/app/Http/Middleware/HandleRequest.php).
type ApiEnvelope<T> = {
  message: string;
  success: boolean;
  data: T;
  type: string;
  meta: unknown;
};

// ─── /admin/stats ───────────────────────────────────────────────────────────
// All-time platform totals. See AdminController::stats().

export type Stats = {
  total_user: number;
  total_user_balance: number;
  api_balances: number;
  total_funding_today: number;
  total_signups_today: number;
  transaction_count: number;
};

export const statsService = {
  get: (): Promise<Stats> =>
    apiClient.get<ApiEnvelope<Stats>>("/admin/stats").then((r) => r.data.data),
};

// ─── /admin/analytics ───────────────────────────────────────────────────────
// Date-range analytics (defaults to the last 30 days). See AnalyticsController.

export type AnalyticsSummary = {
  total_revenue: number;
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  pending_transactions: number;
  success_rate: number;
  average_transaction_value: number;
  new_signups: number;
};

export type Series = { labels: string[]; values: number[] };

export type ServiceTypeBreakdown = {
  type: string;
  label: string;
  revenue: number;
  count: number;
};

export type ProviderBreakdown = { provider: string; revenue: number; count: number };

export type TopCustomer = {
  user_id: number;
  name: string;
  email: string | null;
  total_spent: number;
  transaction_count: number;
};

export type Analytics = {
  period: { start_date: string; end_date: string };
  summary: AnalyticsSummary;
  revenue_over_time: Series;
  transactions_over_time: {
    labels: string[];
    success: number[];
    fail: number[];
    pending: number[];
  };
  by_service_type: ServiceTypeBreakdown[];
  by_provider: ProviderBreakdown[];
  signups_over_time: Series;
  funding_vs_spend: { total_funding: number; total_spend: number };
  top_customers: TopCustomer[];
};

export type AnalyticsParams = { start_date?: string; end_date?: string };

export const analyticsService = {
  get: (params?: AnalyticsParams): Promise<Analytics> =>
    apiClient
      .get<ApiEnvelope<Analytics>>("/admin/analytics", { params })
      .then((r) => r.data.data),
};
