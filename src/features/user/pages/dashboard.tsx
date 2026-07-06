import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet, ArrowDownLeft, ShoppingBag, CheckCircle2, AlertTriangle, TrendingUp,
  Plus, ChevronRight, Phone, Wifi, Tv, Plug, Gift, Eye, EyeOff, Receipt, LogIn,
  Banknote,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { fmt } from "../data/mock";
import { SkeletonCard, StatusBadge, StatCard, Card, Button, EmptyState } from "../components/shared-ui";
import { useAuth, type UserTransaction } from "../../../shared/providers/auth";
import { customerService } from "../services/customerService";
import { transactionTypeMeta, isCredit, toNumber, badgeStatus } from "../utils/transactionDisplay";

const quickActions = [
  { label: "Fund wallet", icon: Wallet, path: "/wallet" },
  { label: "Buy airtime", icon: Phone, path: "/buy-airtime" },
  { label: "Buy data", icon: Wifi, path: "/buy-data" },
  { label: "Electricity", icon: Plug, path: "/electricity" },
  { label: "Cable TV", icon: Tv, path: "/cable-tv" },
  { label: "Airtime to cash", icon: Banknote, path: "/airtime-to-cash" },
];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const dateLabel = (value: string) =>
  new Date(value).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function DashboardPage() {
  const { user, isInitializing, refreshUser } = useAuth();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [converting, setConverting] = useState(false);
  const navigate = useNavigate();

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

  const derived = useMemo(() => {
    const now = new Date();
    let totalDeposits = 0;
    let totalPurchases = 0;
    let todaySpend = 0;
    let todayDataGB = 0;

    for (const tx of transactions) {
      if (tx.status !== "success") continue;
      const created = new Date(tx.created_at);
      const amount = toNumber(tx.amount);
      const credit = isCredit(tx);

      if (isSameMonth(created, now)) {
        if (credit) totalDeposits += amount;
        else totalPurchases += amount;
      }
      if (!credit && isSameDay(created, now)) todaySpend += amount;
      if (tx.transaction_type === "data_subscription" && isSameDay(created, now)) {
        todayDataGB += toNumber(tx.quantity);
      }
    }

    return { totalDeposits, totalPurchases, todaySpend, todayDataGB };
  }, [transactions]);

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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
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

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (user.fullname ?? user.username ?? "there").split(" ")[0];
  const referralBalance = toNumber(user.referral_balance);
  const monthlySuccessful = user.stats?.monthly_successful ?? 0;
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
      <Card className="p-5 bg-slate-900 border-slate-900">
        <div className="flex items-start justify-between flex-wrap gap-5">
          <div>
            <p className="text-slate-400 text-xs mb-1.5">Available balance</p>
            <div className="flex items-center gap-3">
              <span className="text-white text-3xl font-semibold tabular-nums">
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
          <div className="flex gap-2.5 shrink-0">
            <Button onClick={() => navigate("/wallet")} className="bg-white text-slate-900 hover:bg-gray-100">
              <Plus className="w-4 h-4" /> Fund wallet
            </Button>
            <Button variant="secondary" onClick={() => navigate("/transactions")} className="bg-white/10 border-white/10 text-white hover:bg-white/15">
              <Receipt className="w-4 h-4" /> History
            </Button>
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Deposits this month" value={fmt(derived.totalDeposits)} icon={ArrowDownLeft} tone="success" meta="This month" />
        <StatCard label="Purchases this month" value={fmt(derived.totalPurchases)} icon={ShoppingBag} tone="neutral" meta="This month" />
        <StatCard label="Successful" value={String(monthlySuccessful)} icon={CheckCircle2} tone="success" meta="This month" />
        <StatCard label="Pending / failed" value={String(monthlyAttention)} icon={AlertTriangle} tone="warning" meta="Needs attention" />
        <StatCard label="Today's spend" value={fmt(derived.todaySpend)} icon={TrendingUp} tone="neutral" meta="Across all services" />
        <StatCard label="Data bought today" value={`${derived.todayDataGB}GB`} icon={Wifi} tone="neutral" meta="Data subscriptions" />
      </div>

      {/* Quick actions */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-[#111827]/30 hover:bg-[#111827]/5 transition-colors"
            >
              <div className="w-8 h-8 bg-[#111827]/10 text-[#111827] rounded-lg flex items-center justify-center">
                <a.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-700 text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Chart + Network Status */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 p-4">
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
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={spendingChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${v / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [fmt(Number(v)), "Spent"]} />
                <Area type="monotone" dataKey="amount" stroke="#111827" strokeWidth={1.75} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
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
                      <span className={`w-1.5 h-1.5 rounded-full ${available ? "bg-emerald-500" : "bg-amber-500"}`} />
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
