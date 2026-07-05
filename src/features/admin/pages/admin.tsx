import {
  Users,
  TrendingUp,
  Wallet,
  XCircle,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  Server,
  Activity,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { fmt, fmtCompact } from "../../user/data/mock";
import {
  StatusBadge,
  StatCard,
  PageHeader,
  Card,
  Button,
  SkeletonLine,
  EmptyState,
} from "../../user/components/shared-ui";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import { statsService, analyticsService, type Analytics, type Stats } from "./dashboardService";
import { providerService, type Provider } from "./apis/providerService";
import { transactionService, type Transaction } from "./customers/service";

const chartValue = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0));

const SERVICE_TX_LABELS: Record<string, string> = {
  airtime_recharge: "Airtime",
  data_subscription: "Data",
  cable_subscription: "Cable",
  electric_bill: "Electricity",
  exam: "Exam PIN",
};

const txDisplayType = (type: string) => SERVICE_TX_LABELS[type] ?? type;

// Status colors reused verbatim from StatusBadge's statusMap (emerald/amber/red)
// so the trend chart reads consistently with every status badge in the app.
const STATUS_COLOR = { success: "#10b981", pending: "#f59e0b", fail: "#ef4444" };

const RANGE_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

const toDateParam = (d: Date) => d.toISOString().slice(0, 10);

const rangeParams = (days: number) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return { start_date: toDateParam(start), end_date: toDateParam(end) };
};

const chartDateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { month: "short", day: "numeric" });

// Show ~8 evenly-spaced x-axis ticks regardless of how many days are in range.
const tickInterval = (len: number) => Math.max(0, Math.floor(len / 8) - 1);

export default function AdminPage() {
  const navigate = useNavigate();

  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes, providersRes, txnsRes] = await Promise.all([
        statsService.get().catch(() => null),
        analyticsService.get(rangeParams(rangeDays)).catch(() => null),
        providerService.getAll().catch(() => []),
        transactionService.getRecent(8).catch(() => []),
      ]);
      setStats(statsRes);
      setAnalytics(analyticsRes);
      setProviders(providersRes);
      setRecentTxns(txnsRes);
      setLastSynced(new Date());
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const rangeLabel = `Last ${rangeDays} days`;

  const lowBalanceProviders = providers.filter(
    (p) =>
      p.auto_fund_threshold != null &&
      Number(p.balance ?? 0) < Number(p.auto_fund_threshold),
  );

  const failedCount = analytics?.summary.failed_transactions ?? 0;

  const alerts = [
    ...lowBalanceProviders.map((p) => ({
      key: `provider-${p.id}`,
      icon: Server,
      tone: "danger" as const,
      title: `${p.name} balance is low`,
      description: `${fmt(Number(p.balance ?? 0))} remaining — below the ${fmt(Number(p.auto_fund_threshold))} threshold.`,
    })),
    ...(failedCount > 0
      ? [
          {
            key: "failed-transactions",
            icon: ShieldAlert,
            tone: "danger" as const,
            title: `${failedCount} failed transaction${failedCount === 1 ? "" : "s"}`,
            description: `In the ${rangeLabel.toLowerCase()} (${analytics?.period.start_date} – ${analytics?.period.end_date}).`,
          },
        ]
      : []),
  ];

  const statCards = [
    {
      label: "Total users",
      value: stats ? stats.total_user.toLocaleString() : "—",
      meta: stats ? `+${stats.total_signups_today} today` : undefined,
      icon: Users,
      tone: "neutral" as const,
    },
    {
      label: "Total wallet balance",
      value: stats ? fmtCompact(stats.total_user_balance) : "—",
      meta: "Combined across users",
      icon: Wallet,
      tone: "neutral" as const,
    },
    {
      label: "Total sales",
      value: analytics ? fmtCompact(analytics.summary.total_revenue) : "—",
      meta: rangeLabel,
      icon: TrendingUp,
      tone: "success" as const,
    },
    {
      label: "Successful transactions",
      value: analytics ? analytics.summary.successful_transactions.toLocaleString() : "—",
      meta: analytics ? `${analytics.summary.success_rate}% success rate` : undefined,
      icon: CheckCircle2,
      tone: "success" as const,
    },
    {
      label: "Failed transactions",
      value: analytics ? analytics.summary.failed_transactions.toLocaleString() : "—",
      meta: rangeLabel,
      icon: XCircle,
      tone: "danger" as const,
    },
    {
      label: "Pending transactions",
      value: analytics ? analytics.summary.pending_transactions.toLocaleString() : "—",
      meta: rangeLabel,
      icon: Clock3,
      tone: "warning" as const,
    },
  ];

  const revenueChartData = useMemo(
    () =>
      analytics
        ? analytics.revenue_over_time.labels.map((label, i) => ({
            date: chartDateLabel(label),
            revenue: analytics.revenue_over_time.values[i] ?? 0,
          }))
        : [],
    [analytics],
  );

  const txVolumeData = useMemo(
    () =>
      analytics
        ? analytics.transactions_over_time.labels.map((label, i) => ({
            date: chartDateLabel(label),
            success: analytics.transactions_over_time.success[i] ?? 0,
            pending: analytics.transactions_over_time.pending[i] ?? 0,
            fail: analytics.transactions_over_time.fail[i] ?? 0,
          }))
        : [],
    [analytics],
  );

  const serviceBreakdown = useMemo(() => {
    if (!analytics) return [];
    const totalRevenue = analytics.by_service_type.reduce((s, t) => s + t.revenue, 0);
    return analytics.by_service_type
      .filter((t) => t.count > 0)
      .map((t) => ({
        name: t.label,
        value: totalRevenue > 0 ? Math.round((t.revenue / totalRevenue) * 100) : 0,
      }));
  }, [analytics]);

  const fundingVsSpend = analytics?.funding_vs_spend ?? null;
  const fundingTotal = fundingVsSpend
    ? fundingVsSpend.total_funding + fundingVsSpend.total_spend
    : 0;
  const fundingPct =
    fundingVsSpend && fundingTotal > 0
      ? Math.round((fundingVsSpend.total_funding / fundingTotal) * 100)
      : 50;
  const netFlow = fundingVsSpend
    ? fundingVsSpend.total_funding - fundingVsSpend.total_spend
    : 0;

  return (
    <div className="space-y-5">
      {/* System status strip */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-50 border border-gray-200 rounded-lg px-3.5 py-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-600">
              All systems operational
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            {lastSynced
              ? `Last synced ${lastSynced.toLocaleTimeString()}`
              : "Syncing…"}
          </span>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Sync now
        </button>
      </div>

      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            Admin dashboard
            <span className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
              Super admin
            </span>
          </span>
        }
        description="Platform overview and operations"
        actions={
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.days}
                onClick={() => setRangeDays(r.days)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  rangeDays === r.days
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && !stats && !analytics
          ? [...Array(6)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-gray-200 space-y-2">
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="h-6 w-24" />
              </div>
            ))
          : statCards.map((s) => (
              <StatCard
                key={s.label}
                label={s.label}
                value={s.value}
                meta={s.meta}
                icon={s.icon}
                tone={s.tone}
              />
            ))}
      </div>

      {/* Needs attention */}
      {alerts.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-slate-900">
              Needs your attention
            </h3>
            <span className="text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
              {alerts.length} open
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {alerts.map((a) => (
              <div key={a.key} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-600">
                  <a.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {a.title}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {a.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Provider balances */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Provider balances
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/admin/apis/provider")}
          >
            Manage providers
          </Button>
        </div>
        {loading && providers.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <SkeletonLine key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <EmptyState
            icon={Server}
            title="No providers configured"
            description="Add a vendor provider to start tracking balances here."
          />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {providers.map((p) => {
              const isLow =
                p.auto_fund_threshold != null &&
                Number(p.balance ?? 0) < Number(p.auto_fund_threshold);
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-lg border ${isLow ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                      <Server className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    {isLow && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 ml-auto" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-600 truncate capitalize">
                    {p.name}
                  </p>
                  <p
                    className={`font-semibold text-sm mt-1 ${isLow ? "text-red-600" : "text-slate-900"}`}
                  >
                    {fmt(Number(p.balance ?? 0))}
                  </p>
                  {isLow && (
                    <p className="text-xs text-red-500 mt-0.5">Low balance</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Revenue chart + service breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Revenue overview
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{rangeLabel}</p>
            </div>
          </div>
          {loading && !analytics ? (
            <SkeletonLine className="h-[170px] w-full" />
          ) : revenueChartData.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No revenue yet"
              description={`Successful transactions in the ${rangeLabel.toLowerCase()} will show up here.`}
            />
          ) : (
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart
                data={revenueChartData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  interval={tickInterval(revenueChartData.length)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => fmtCompact(v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(v) => [fmt(chartValue(v)), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fill="#4f46e5"
                  fillOpacity={0.1}
                  dot={false}
                  activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3.5">
            Service breakdown
          </h3>
          {loading && !analytics ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <SkeletonLine key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : serviceBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              No service revenue yet.
            </p>
          ) : (
            <div className="space-y-3">
              {serviceBreakdown.map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600">{s.name}</span>
                    <span className="text-slate-400">{s.value}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Transaction volume trend + top customers / funding vs spend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Transaction volume
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{rangeLabel}</p>
          </div>
          {loading && !analytics ? (
            <SkeletonLine className="h-[200px] w-full" />
          ) : txVolumeData.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No transactions yet"
              description={`Transactions in the ${rangeLabel.toLowerCase()} will show up here.`}
            />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={txVolumeData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  interval={tickInterval(txVolumeData.length)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  iconType="line"
                  iconSize={14}
                />
                <Line
                  type="monotone"
                  dataKey="success"
                  name="Successful"
                  stroke={STATUS_COLOR.success}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  name="Pending"
                  stroke={STATUS_COLOR.pending}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="fail"
                  name="Failed"
                  stroke={STATUS_COLOR.fail}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <div className="space-y-4">
          {/* Funding vs spend */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Funding vs spend
            </h3>
            {loading && !analytics ? (
              <div className="space-y-2">
                <SkeletonLine className="h-4 w-full" />
                <SkeletonLine className="h-4 w-full" />
                <SkeletonLine className="h-2 w-full" />
              </div>
            ) : !fundingVsSpend || fundingTotal === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No funding or spend activity yet.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    Funding
                  </span>
                  <span className="font-semibold text-slate-900">
                    {fmtCompact(fundingVsSpend.total_funding)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Spend
                  </span>
                  <span className="font-semibold text-slate-900">
                    {fmtCompact(fundingVsSpend.total_spend)}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden flex bg-gray-100 gap-0.5">
                  <div
                    className="h-full bg-violet-500 first:rounded-l-full"
                    style={{ width: `${fundingPct}%` }}
                  />
                  <div
                    className="h-full bg-indigo-600 last:rounded-r-full"
                    style={{ width: `${100 - fundingPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                  Net {netFlow >= 0 ? "+" : "−"}
                  {fmtCompact(Math.abs(netFlow))}
                </p>
              </>
            )}
          </Card>

          {/* Top customers */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Top customers
            </h3>
            <p className="text-[10px] text-slate-400 -mt-2 mb-3">{rangeLabel}</p>
            {loading && !analytics ? (
              <div className="space-y-2.5">
                {[...Array(4)].map((_, i) => (
                  <SkeletonLine key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : !analytics || analytics.top_customers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No customer activity yet.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {analytics.top_customers.slice(0, 6).map((c, i) => (
                  <div key={c.user_id} className="flex items-center gap-2.5 py-2 first:pt-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {c.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {c.email ?? "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-slate-900">
                        {fmtCompact(c.total_spent)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {c.transaction_count} txns
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent transactions */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-slate-900">
            Recent transactions
          </h3>
          <button
            onClick={() => navigate("/admin/transactions")}
            className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
          >
            View all
          </button>
        </div>
        {loading && recentTxns.length === 0 ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <SkeletonLine key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : recentTxns.length === 0 ? (
          <EmptyState
            icon={ArrowRight}
            title="No transactions yet"
            description="Transactions will show up here as they happen."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed min-w-[440px] lg:min-w-0">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-[22%] text-left px-4 py-2 text-xs font-medium text-slate-500">
                    Reference
                  </th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">
                    User
                  </th>
                  <th className="hidden lg:table-cell w-[14%] text-left px-3 py-2 text-xs font-medium text-slate-500">
                    Type
                  </th>
                  <th className="w-[18%] text-right px-3 py-2 text-xs font-medium text-slate-500">
                    Amount
                  </th>
                  <th className="w-[16%] text-left px-3 py-2 text-xs font-medium text-slate-500">
                    Status
                  </th>
                  <th className="hidden lg:table-cell w-[14%] text-right px-4 py-2 text-xs font-medium text-slate-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTxns.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 truncate">
                      {tx.reference}
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-900 text-xs truncate">
                      {tx.user?.fullname ?? `User #${tx.user_id}`}
                    </td>
                    <td className="hidden lg:table-cell px-3 py-3 text-xs text-slate-500 truncate">
                      {txDisplayType(tx.transaction_type)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-900 text-xs tabular-nums whitespace-nowrap">
                      {fmt(chartValue(tx.amount))}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge
                        status={tx.status === "fail" ? "failed" : tx.status}
                      />
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-right text-xs text-slate-400 whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString("en-NG", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
