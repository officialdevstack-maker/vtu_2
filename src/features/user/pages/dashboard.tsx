import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Wallet, ShoppingBag,
  Plus, ChevronRight, Phone, Wifi, Tv, Plug, Gift, Eye, EyeOff, Receipt, LogIn,
  Banknote, Send, Landmark, CheckCircle2, TrendingUp, ArrowUpRight, ArrowDownLeft,
  Settings2, X, ArrowLeft, ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fmt, fmtCompact } from "../data/mock";
import { SkeletonCard, StatusBadge, Card, Button, EmptyState, CopyButton } from "../components/shared-ui";
import { useAuth, type UserTransaction } from "../../../shared/providers/auth";
import { customerService } from "../services/customerService";
import { transactionTypeMeta, isCredit, toNumber, badgeStatus } from "../utils/transactionDisplay";
import { useDashboardUser } from "../hooks/use-dashboard-user";

const SpendingChart = lazy(() => import("../components/spending-chart"));

const quickActions = [
  { label: "Fund wallet", icon: Wallet, path: "/wallet?tab=fund" },
  { label: "Send money", icon: Send, path: "/wallet?tab=send" },
  { label: "Withdraw", icon: Landmark, path: "/wallet?tab=withdraw" },
  { label: "Buy airtime", icon: Phone, path: "/buy-airtime" },
  { label: "Buy data", icon: Wifi, path: "/buy-data" },
  { label: "Electricity", icon: Plug, path: "/electricity" },
  { label: "Cable TV", icon: Tv, path: "/cable-tv" },
  { label: "Airtime to cash", icon: Banknote, path: "/airtime-to-cash" },
];

const QUICK_ACTIONS_KEY = "vendify-dashboard-quick-actions";
const defaultQuickActionLabels = ["Buy data", "Buy airtime", "Electricity", "Fund wallet"];

function CountUpAmount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const startedAt = performance.now();
    const duration = 650;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setDisplay(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{fmt(display)}</>;
}

const relativeDate = (value: string) => {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
};

const maskRecipient = (value: string | null) => {
  if (!value) return "—";
  if (value.length < 7) return value;
  return `${value.slice(0, 4)}••••${value.slice(-3)}`;
};

const dateLabel = (value: string) =>
  new Date(value).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// Service purchases that can be repeated from the dashboard, mapped to
// the page where the customer can make the same purchase again.
const repeatPurchaseRoutes: Record<string, string> = {
  airtime_recharge: "/buy-airtime",
  data_subscription: "/buy-data",
  cable_subscription: "/cable-tv",
  electric_bill: "/electricity",
};

export default function DashboardPage() {
  const { isInitializing, refreshUser } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [converting, setConverting] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 90>(30);
  const [customisingActions, setCustomisingActions] = useState(false);
  const [quickActionLabels, setQuickActionLabels] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(QUICK_ACTIONS_KEY) ?? "null");
      return Array.isArray(saved) && saved.length === 4 ? saved : defaultQuickActionLabels;
    } catch {
      return defaultQuickActionLabels;
    }
  });
  const navigate = useNavigate();

  const dashboardUserQuery = useDashboardUser();
  const user = dashboardUserQuery.user;

  const transactions = useMemo<UserTransaction[]>(
    () =>
      [...(user?.transactions ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [user?.transactions],
  );

  const banks = user?.banks ?? [];
  const primaryBank = banks.find((b) => b.status === "active") ?? banks[0];

  const lastPurchase = useMemo(
    () =>
      transactions.find(
        (tx) => tx.status === "success" && repeatPurchaseRoutes[tx.transaction_type],
      ),
    [transactions],
  );

  const spendingChart = useMemo(
    () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - chartPeriod);
      return (user?.stats?.tx_amount_30d ?? []).filter((row) => new Date(row.date) >= cutoff).map((row) => ({
        day: new Date(row.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
        amount: toNumber(row.total_amount),
      }));
    },
    [user?.stats?.tx_amount_30d, chartPeriod],
  );

  // "This month at a glance" — an encouraging summary of the customer's own
  // activity, replacing the old network-status card.
  const monthStats = useMemo(() => {
    const s = user?.stats;
    const success = s?.monthly_successful ?? 0;
    const failed = s?.monthly_failed ?? 0;
    const pending = s?.monthly_pending ?? 0;
    const total = success + failed + pending;
    return {
      success,
      successRate: total > 0 ? Math.round((success / total) * 100) : 100,
      spent: toNumber(s?.monthly_purchases ?? 0),
      funded: toNumber(s?.monthly_deposits ?? 0),
      previousSpent: toNumber(s?.previous_month_purchases ?? 0),
    };
  }, [user?.stats]);

  const handleConvertReferral = async () => {
    if (!user) return;
    setConverting(true);
    try {
      await customerService.convertReferralToWallet(user.id);
      await refreshUser();
    } finally {
      setConverting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="grid gap-3 md:grid-cols-3 sm:gap-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="p-8">
        <EmptyState icon={LogIn} title="Sign in required" description="Log in to view your dashboard." />
      </Card>
    );
  }

  const dashboardDetailsLoading =
    dashboardUserQuery.isPending && !user.stats;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (user.fullname ?? user.username ?? "there").split(" ")[0];
  const referralBalance = toNumber(user.referral_balance);
  const walletBalance = toNumber(user.wallet_balance);
  const spendChange = monthStats.previousSpent > 0
    ? Math.round(((monthStats.spent - monthStats.previousSpent) / monthStats.previousSpent) * 100)
    : null;
  const selectedQuickActions = quickActionLabels
    .map((label) => quickActions.find((action) => action.label === label))
    .filter((action): action is (typeof quickActions)[number] => Boolean(action));
  const chartTotal = spendingChart.reduce((sum, point) => sum + point.amount, 0);
  const topPurchase = user.stats?.top_purchase;
  const topPurchaseLabel = topPurchase
    ? (transactionTypeMeta[topPurchase.transaction_type]?.label ?? topPurchase.transaction_type)
    : null;

  const saveQuickActions = (labels: string[]) => {
    setQuickActionLabels(labels);
    localStorage.setItem(QUICK_ACTIONS_KEY, JSON.stringify(labels));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{greeting}, {firstName}</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {now.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Balance banner */}
      <Card className="group relative overflow-hidden border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.75)] transition-all duration-200 hover:-translate-y-0.5 sm:p-5">
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent" aria-hidden="true" />
        <span className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-orange-500/[0.08] blur-3xl" aria-hidden="true" />
        <div className="flex items-start justify-between flex-wrap gap-5">
          <div className="min-w-0 flex-1">
            <p className="text-slate-400 text-xs mb-1.5">Available balance</p>
            <div className="flex items-center gap-3">
              <span className="min-w-0 break-words text-2xl font-semibold text-white tabular-nums sm:text-3xl">
                {balanceVisible ? <CountUpAmount value={walletBalance} /> : "Balance hidden"}
              </span>
              <button onClick={() => setBalanceVisible((v) => !v)} className="text-slate-400 hover:text-white transition-colors">
                {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <Gift className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-400 text-xs">
                Referral balance: {fmt(referralBalance)}
              </span>
              {referralBalance > 0 && (
                <button
                  onClick={() => void handleConvertReferral()}
                  disabled={converting}
                  className="text-xs font-medium text-slate-300 hover:text-slate-200 disabled:opacity-50 transition-colors"
                >
                  {converting ? "Converting…" : "Convert to wallet"}
                </button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-white/10 pt-3 text-xs">
              <span className="text-slate-400"><span className="text-emerald-400">↑</span> {fmt(monthStats.funded)} received</span>
              <span className="text-slate-400"><span className="text-orange-300">↓</span> {fmt(monthStats.spent)} spent this month</span>
              {spendChange !== null && (
                <span className={spendChange <= 0 ? "text-emerald-300" : "text-orange-300"}>
                  {spendChange <= 0 ? "↓" : "↑"} {Math.abs(spendChange)}% vs last month
                </span>
              )}
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:shrink-0">
            <Button onClick={() => navigate("/wallet")} className="bg-white text-slate-900 hover:bg-gray-100">
              <Plus className="w-4 h-4" /> Fund wallet
            </Button>
            <Button variant="secondary" onClick={() => navigate("/transactions")} className="bg-white/10 border-white/10 text-white hover:bg-white/15">
              <Receipt className="w-4 h-4" /> History
            </Button>
          </div>
        </div>
      </Card>

      {/* Action cards */}
      {dashboardDetailsLoading ? (
        <div className="grid gap-3 md:grid-cols-3 sm:gap-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 sm:gap-4">
          {/* Fund by bank transfer */}
          <Card className="flex h-full min-w-0 flex-col p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#111827]/10 text-[#111827] flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Fund by bank transfer</h3>
            </div>
            {primaryBank ? (
              <div className="flex flex-1 flex-col">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-900 text-sm font-medium truncate">{primaryBank.bank_name}</span>
                    <StatusBadge status={primaryBank.status} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 text-sm shrink-0">Account number</span>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-semibold font-mono tracking-wide text-slate-900">
                        {primaryBank.bank_account}
                      </span>
                      <CopyButton value={primaryBank.bank_account} label="account number" />
                    </div>
                  </div>
                  {primaryBank.account_name && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 text-sm shrink-0">Account name</span>
                      <span className="truncate text-slate-900 text-sm font-medium">{primaryBank.account_name}</span>
                    </div>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-2.5">
                  Transfer any amount — your wallet is credited automatically.
                </p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-between gap-3">
                <p className="text-sm text-slate-500">
                  Get a dedicated account number and fund your wallet by bank transfer.
                </p>
                <Button size="sm" className="self-start" onClick={() => navigate("/wallet?tab=fund")}>
                  <Plus className="w-4 h-4" /> Fund wallet
                </Button>
              </div>
            )}
          </Card>

          {/* Buy again */}
          <Card className="flex h-full min-w-0 flex-col p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#111827]/10 text-[#111827] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Buy again</h3>
            </div>
            {lastPurchase ? (
              <div className="flex flex-1 flex-col">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-900 text-sm font-medium truncate">
                      {[lastPurchase.provider?.toUpperCase(), lastPurchase.quantity ? `${lastPurchase.quantity}GB` : null, transactionTypeMeta[lastPurchase.transaction_type]?.label ?? lastPurchase.transaction_type].filter(Boolean).join(" · ")}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-slate-900 shrink-0">
                      {fmt(toNumber(lastPurchase.amount))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 text-sm shrink-0">Recipient</span>
                    <span className="truncate text-slate-900 text-sm font-medium font-mono">
                      {maskRecipient(lastPurchase.receiver ?? lastPurchase.account_or_phone)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 text-sm shrink-0">Date</span>
                    <span className="truncate text-slate-900 text-sm font-medium" title={dateLabel(lastPurchase.created_at)}>{relativeDate(lastPurchase.created_at)}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="mt-2.5 self-start"
                  onClick={() => navigate(repeatPurchaseRoutes[lastPurchase.transaction_type])}
                >
                  Buy again · {fmt(toNumber(lastPurchase.amount))}
                </Button>
              </div>
            ) : (
              <div className="flex flex-1 flex-col justify-between gap-3">
                <p className="text-sm text-slate-500">
                  Your most recent purchase will appear here for one-tap repeat.
                </p>
                <Button size="sm" className="self-start" onClick={() => navigate("/buy-data")}>
                  <Wifi className="w-4 h-4" /> Buy data
                </Button>
              </div>
            )}
          </Card>

          {/* Refer & earn */}
          <Card className="flex h-full min-w-0 flex-col p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#111827]/10 text-[#111827] flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Refer & earn</h3>
            </div>
            <div className="flex flex-1 flex-col">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 space-y-2.5">
                {user.referral_code && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 text-sm shrink-0">Your code</span>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-semibold font-mono tracking-wide text-slate-900">
                        {user.referral_code}
                      </span>
                      <CopyButton value={user.referral_code} label="referral code" />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 text-sm shrink-0">Earned so far</span>
                  <span className="text-slate-900 text-sm font-semibold tabular-nums">{fmt(referralBalance)}</span>
                </div>
              </div>
              <button
                onClick={() => navigate("/referral")}
                className="mt-2.5 self-start text-xs text-[#111827] font-medium flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                Invite friends & earn <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        </div>
      )}

      {dashboardUserQuery.isError && !user.stats ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Some dashboard activity could not be loaded. Your balance is still available.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void dashboardUserQuery.refetch()}
          >
            Retry
          </Button>
        </Card>
      ) : null}

      {/* Quick actions */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Quick actions</h3>
          <button onClick={() => setCustomisingActions(true)} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900">
            <Settings2 className="h-3.5 w-3.5" /> Customise
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {selectedQuickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="group flex min-h-24 min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-[#111827]/[0.025] hover:shadow-[0_8px_24px_-16px_rgba(249,115,22,0.8)] active:scale-[0.98] sm:p-3"
            >
              <div className="w-8 h-8 bg-[#111827]/10 text-[#111827] rounded-lg flex items-center justify-center transition-colors group-hover:bg-[#111827] group-hover:text-white">
                <a.icon className="w-4 h-4" />
              </div>
              <span className="overflow-wrap-anywhere text-center text-xs font-medium leading-snug text-slate-700">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Chart + Network Status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="min-w-0 overflow-hidden p-3 sm:p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Spending overview</h3>
              <p className="text-xs text-slate-400 mt-0.5">{fmt(chartTotal)} total spent</p>
            </div>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              {([7, 30, 90] as const).map((period) => (
                <button key={period} onClick={() => setChartPeriod(period)} className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all ${chartPeriod === period ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                  {period === 90 ? "3M" : `${period}D`}
                </button>
              ))}
            </div>
          </div>
          {spendingChart.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">
              No successful transactions in this period yet.
            </div>
          ) : (
            <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-slate-100" />}>
              <SpendingChart data={spendingChart} />
            </Suspense>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">This month at a glance</h3>
              <p className="text-xs text-slate-400 mt-0.5">Your activity so far</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Successful", value: monthStats.success.toLocaleString(), icon: CheckCircle2, tint: "text-emerald-600 bg-emerald-50" },
              { label: "Success rate", value: `${monthStats.successRate}%`, icon: TrendingUp, tint: "text-indigo-600 bg-indigo-50" },
              { label: "Spent", value: fmtCompact(monthStats.spent), icon: ArrowUpRight, tint: "text-rose-600 bg-rose-50" },
              { label: "Funded", value: fmtCompact(monthStats.funded), icon: ArrowDownLeft, tint: "text-sky-600 bg-sky-50" },
            ].map((tile) => (
              <div key={tile.label} className="rounded-xl border border-gray-100 p-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${tile.tint}`}>
                  <tile.icon className="w-4 h-4" />
                </div>
                <p className="text-lg font-semibold text-slate-900 leading-tight">{tile.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{tile.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50/60 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-orange-700">Your monthly insight</p>
            {topPurchase ? (
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                You spent the most on <span className="font-semibold text-slate-900">{topPurchaseLabel}</span> this month: {fmt(topPurchase.total_amount)} across {topPurchase.transaction_count} {topPurchase.transaction_count === 1 ? "transaction" : "transactions"}.
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Complete a purchase to unlock personalised spending insights.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-slate-900">Recent transactions</h3>
          <button
            onClick={() => navigate("/transactions")}
            className="text-xs text-[#111827] font-medium hover:text-[#111827] flex items-center gap-1"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {transactions.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions yet" description="Your purchases and wallet funding will show up here." />
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.slice(0, 6).map((tx) => {
              const meta = transactionTypeMeta[tx.transaction_type] ?? { label: tx.transaction_type, icon: Gift };
              const credit = isCredit(tx);
              const amount = toNumber(tx.amount);
              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <meta.icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{meta.label}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {tx.receiver ?? tx.account_or_phone ?? tx.transaction_reference} · {dateLabel(tx.created_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-medium tabular-nums ${credit ? "text-emerald-600" : "text-slate-900"}`}>
                      {credit ? "+" : "-"}{fmt(amount)}
                    </p>
                    <div className="mt-0.5 flex justify-end">
                      <StatusBadge status={badgeStatus(tx.status)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {customisingActions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="quick-actions-title">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="quick-actions-title" className="text-sm font-semibold text-slate-900">Customise quick actions</h2>
                <p className="mt-1 text-xs text-slate-500">Choose four shortcuts and arrange them in your preferred order.</p>
              </div>
              <button onClick={() => setCustomisingActions(false)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {quickActionLabels.map((label, index) => {
                const action = quickActions.find((item) => item.label === label)!;
                return (
                  <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white"><action.icon className="h-4 w-4" /></div>
                    <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
                    <button disabled={index === 0} onClick={() => { const next = [...quickActionLabels]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; saveQuickActions(next); }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-25" aria-label={`Move ${label} left`}><ArrowLeft className="h-3.5 w-3.5" /></button>
                    <button disabled={index === quickActionLabels.length - 1} onClick={() => { const next = [...quickActionLabels]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; saveQuickActions(next); }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-25" aria-label={`Move ${label} right`}><ArrowRight className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })}
            </div>

            <p className="mb-2 mt-4 text-xs font-medium text-slate-500">Replace the last shortcut with:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.filter((action) => !quickActionLabels.includes(action.label)).map((action) => (
                <button key={action.label} onClick={() => saveQuickActions([...quickActionLabels.slice(0, 3), action.label])} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700">
                  {action.label}
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <Button size="sm" onClick={() => setCustomisingActions(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
