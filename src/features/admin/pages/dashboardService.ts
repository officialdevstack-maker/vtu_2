import type { QueryClient } from "@tanstack/react-query";
import { apiClient } from "@shared/api/apiClient";
import { providerService } from "./apis/providerService";
import { transactionService } from "./customers/service";

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

export type AffiliateSummary = {
  total: number;
  active: number;
  pending: number;
  stale: number;
  total_synced_customers: number;
  total_synced_transactions: number;
  total_synced_transaction_volume: number;
};

export type Stats = {
  total_user: number;
  total_user_balance: number;
  api_balances: number;
  total_funding_today: number;
  total_signups_today: number;
  transaction_count: number;
  affiliates: AffiliateSummary;
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

// ─── Prefetch ────────────────────────────────────────────────────────────
// Kicked off on hover over the admin sidebar's Dashboard link so the page's
// four panels are already cached (or in flight) by the time the click lands.
// Query keys/params here must stay in sync with features/admin/pages/admin.tsx.

const DEFAULT_RANGE_DAYS = 30;

const defaultRangeParams = (): AnalyticsParams => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (DEFAULT_RANGE_DAYS - 1));
  const toDateParam = (d: Date) => d.toISOString().slice(0, 10);
  return { start_date: toDateParam(start), end_date: toDateParam(end) };
};

export const prefetchAdminDashboard = (queryClient: QueryClient) => {
  queryClient.prefetchQuery({ queryKey: ["admin", "stats"], queryFn: () => statsService.get() });
  queryClient.prefetchQuery({
    queryKey: ["admin", "analytics", DEFAULT_RANGE_DAYS],
    queryFn: () => analyticsService.get(defaultRangeParams()),
  });
  queryClient.prefetchQuery({ queryKey: ["admin", "providers"], queryFn: () => providerService.getAll() });
  queryClient.prefetchQuery({
    queryKey: ["admin", "recent-transactions"],
    queryFn: () => transactionService.getRecent(8),
  });
};
