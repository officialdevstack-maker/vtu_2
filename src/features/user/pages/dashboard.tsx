import { lazy, Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet, ShoppingBag, AlertTriangle,
  Plus, ChevronRight, Phone, Wifi, Tv, Plug, Gift, Eye, EyeOff, Receipt, LogIn,
  Banknote, Send, Landmark,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fmt } from "../data/mock";
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
  const navigate = useNavigate();

  const dashboardUserQuery = useDashboardUser();
  const user = dashboardUserQuery.user;

  const networksQuery = useQuery({
    queryKey: ["networks"],
    queryFn: () => customerService.getNetworks(),
  });
  const networks = networksQuery.data ?? [];
  const networksLoading = networksQuery.isPending;

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
    () =>
      (user?.stats?.tx_amount_30d ?? []).map((row) => ({
        day: new Date(row.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
        amount: toNumber(row.total_amount),
      })),
    [user?.stats?.tx_amount_30d],
  );

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
        <div className="grid gap-3 md:grid-cols-3">
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
  const monthlyAttention = (user.stats?.monthly_pending ?? 0) + (user.stats?.monthly_failed ?? 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{greeting}, {firstName}</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {now.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Balance banner */}
      <Card className="relative overflow-hidden bg-slate-900 p-4 border-slate-900 sm:p-5">
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/70 to-transparent" aria-hidden="true" />
        <div className="flex items-start justify-between flex-wrap gap-5">
          <div className="min-w-0 flex-1">
            <p className="text-slate-400 text-xs mb-1.5">Available balance</p>
            <div className="flex items-center gap-3">
              <span className="min-w-0 break-words text-2xl font-semibold text-white tabular-nums sm:text-3xl">
                {balanceVisible ? fmt(toNumber(user.wallet_balance)) : "₦ ••••••"}
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

      {/* Needs-attention alert — only shown when something actually needs it */}
      {monthlyAttention > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-orange-200 bg-orange-50 p-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
            <p className="text-sm text-orange-800">
              {monthlyAttention} transaction{monthlyAttention === 1 ? "" : "s"} this month {monthlyAttention === 1 ? "is" : "are"} pending or failed.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => navigate("/transactions")}>
            Review
          </Button>
        </Card>
      )}

      {/* Action cards */}
      {dashboardDetailsLoading ? (
        <div className="grid gap-3 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {/* Fund by bank transfer */}
          <Card className="flex h-full min-w-0 flex-col p-4">
            <div className="mb-2.5 flex min-w-0 items-start justify-between gap-2">
              <p className="text-xs font-medium text-slate-500">Fund by bank transfer</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            {primaryBank ? (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="min-w-0 break-words text-lg font-semibold text-slate-900 tabular-nums sm:text-xl">
                    {primaryBank.bank_account}
                  </span>
                  <CopyButton value={primaryBank.bank_account} label="account number" />
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  {primaryBank.bank_name}
                  {primaryBank.account_name ? ` · ${primaryBank.account_name}` : ""}
                </p>
                <p className="text-xs text-slate-400 mt-2">Transfers credit your wallet automatically.</p>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 flex-1">
                  Get a dedicated account number and fund your wallet by bank transfer.
                </p>
                <Button size="sm" variant="secondary" className="mt-3 self-start" onClick={() => navigate("/wallet?tab=fund")}>
                  <Plus className="w-4 h-4" /> Fund wallet
                </Button>
              </>
            )}
          </Card>

          {/* Buy again */}
          <Card className="flex h-full min-w-0 flex-col p-4">
            <div className="mb-2.5 flex min-w-0 items-start justify-between gap-2">
              <p className="text-xs font-medium text-slate-500">Buy again</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 brand-primary-soft brand-primary-text">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            {lastPurchase ? (
              <>
                <p className="min-w-0 break-words text-lg font-semibold text-slate-900 sm:text-xl">
                  {transactionTypeMeta[lastPurchase.transaction_type]?.label ?? lastPurchase.transaction_type}
                </p>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  {lastPurchase.receiver ?? lastPurchase.account_or_phone ?? "—"} · {fmt(toNumber(lastPurchase.amount))}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3 self-start"
                  onClick={() => navigate(repeatPurchaseRoutes[lastPurchase.transaction_type])}
                >
                  Repeat purchase
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 flex-1">
                  Your most recent purchase will appear here for one-tap repeat.
                </p>
                <Button size="sm" variant="secondary" className="mt-3 self-start" onClick={() => navigate("/buy-data")}>
                  <Wifi className="w-4 h-4" /> Buy data
                </Button>
              </>
            )}
          </Card>

          {/* Refer & earn */}
          <Card className="flex h-full min-w-0 flex-col p-4">
            <div className="mb-2.5 flex min-w-0 items-start justify-between gap-2">
              <p className="text-xs font-medium text-slate-500">Refer & earn</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-orange-50 text-orange-600">
                <Gift className="w-4 h-4" />
              </div>
            </div>
            {user.referral_code ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="min-w-0 break-words text-lg font-semibold text-slate-900 sm:text-xl">
                  {user.referral_code}
                </span>
                <CopyButton value={user.referral_code} label="referral code" />
              </div>
            ) : (
              <p className="text-sm text-slate-600">Invite friends and earn on their purchases.</p>
            )}
            <p className="text-xs text-slate-400 mt-1">Earned so far: {fmt(referralBalance)}</p>
            <button
              onClick={() => navigate("/referral")}
              className="mt-2 self-start text-xs font-medium text-[#111827] hover:underline flex items-center gap-1"
            >
              View referral program <ChevronRight className="w-3.5 h-3.5" />
            </button>
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
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick actions</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-5">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="group flex min-h-24 min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 p-2.5 transition-all hover:border-orange-200 hover:bg-[#111827]/[0.025] hover:shadow-[0_0_0_3px_rgba(255,122,26,0.05)] sm:p-3"
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="min-w-0 overflow-hidden p-3 sm:p-4 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Spending overview</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 30 days</p>
            </div>
          </div>
          {spendingChart.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">
              No successful transactions in the last 30 days yet.
            </div>
          ) : (
            <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-slate-100" />}>
              <SpendingChart data={spendingChart} />
            </Suspense>
          )}
        </Card>

        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Service availability</h3>
          </div>
          {networksLoading ? (
            <div className="space-y-2.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : networks.length === 0 ? (
            <p className="text-xs text-slate-400">Network status unavailable right now.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {networks.slice(0, 6).map((n) => {
                const available = n.network_types.some((t) => Boolean(t.pivot?.active));
                return (
                  <div key={n.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${available ? "brand-success-pulse bg-emerald-500" : "bg-orange-500"}`} />
                      <span className="text-sm text-slate-700 capitalize">{n.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{available ? "Available" : "Limited"}</span>
                  </div>
                );
              })}
            </div>
          )}
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
    </div>
  );
}
