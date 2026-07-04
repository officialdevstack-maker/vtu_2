import { useState, useEffect } from "react";
import {
  Wallet, ArrowDownLeft, ShoppingBag, CheckCircle2, AlertTriangle, TrendingUp,
  Plus, ChevronRight, Phone, Wifi, Tv, Plug, RefreshCw, Eye, EyeOff, Copy, Check, Receipt,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { fmt, chartValue, mockUser, spendingData, transactions } from "../data/mock";
import { SkeletonCard, StatusBadge, StatCard, Card, Button } from "../components/shared-ui";

const networkStatus = [
  { name: "MTN", status: "operational", uptime: "99.9%" },
  { name: "Airtel", status: "operational", uptime: "99.7%" },
  { name: "Glo", status: "operational", uptime: "98.2%" },
  { name: "9mobile", status: "degraded", uptime: "94.1%" },
];

const quickActions = [
  { label: "Fund wallet", icon: Wallet, path: "/wallet" },
  { label: "Buy airtime", icon: Phone, path: "/buy-airtime" },
  { label: "Buy data", icon: Wifi, path: "/buy-data" },
  { label: "Electricity", icon: Plug, path: "/electricity" },
  { label: "Cable TV", icon: Tv, path: "/cable-tv" },
];

const totalPurchases = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
const totalDeposits = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
const successfulCount = transactions.filter((t) => t.status === "success").length;
const attentionCount = transactions.filter((t) => t.status === "pending" || t.status === "failed").length;
const todaySpend = transactions
  .filter((t) => t.date.startsWith("Today") && t.amount < 0)
  .reduce((s, t) => s + Math.abs(t.amount), 0);

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = mockUser.name.split(" ")[0];

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
                {balanceVisible ? fmt(mockUser.balance) : "₦ ••••••"}
              </span>
              <button onClick={() => setBalanceVisible((v) => !v)} className="text-slate-400 hover:text-white transition-colors">
                {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-slate-400 text-sm font-mono">{mockUser.accountNumber}</span>
              <button
                onClick={() => { navigator.clipboard?.writeText(mockUser.accountNumber); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <span className="text-slate-500 text-xs">· Providus Bank</span>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total deposits" value={fmt(totalDeposits)} icon={ArrowDownLeft} tone="success" meta="This month" />
        <StatCard label="Total purchases" value={fmt(totalPurchases)} icon={ShoppingBag} tone="neutral" meta="This month" />
        <StatCard label="Successful" value={String(successfulCount)} icon={CheckCircle2} tone="success" meta={`of ${transactions.length} this month`} />
        <StatCard label="Pending / failed" value={String(attentionCount)} icon={AlertTriangle} tone="warning" meta="Needs attention" />
        <StatCard label="Today's spend" value={fmt(todaySpend)} icon={TrendingUp} tone="neutral" meta="Across all services" />
      </div>

      {/* Quick actions */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {quickActions.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
            >
              <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
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
              <p className="text-xs text-slate-400 mt-0.5">Last 7 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={spendingData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${v / 1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [fmt(chartValue(v)), "Spent"]} />
              <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={1.75} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Network status</h3>
            <button className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:text-indigo-700">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {networkStatus.map((n) => (
              <div key={n.name} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${n.status === "operational" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <span className="text-sm text-slate-700">{n.name}</span>
                </div>
                <span className="text-xs text-slate-400">{n.uptime} uptime</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-slate-900">Recent transactions</h3>
          <button
            onClick={() => navigate("/transactions")}
            className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {transactions.slice(0, 6).map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <tx.icon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{tx.desc}</p>
                <p className="text-xs text-slate-400 truncate">{tx.detail} · {tx.date}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-medium tabular-nums ${tx.amount > 0 ? "text-emerald-600" : "text-slate-900"}`}>
                  {tx.amount > 0 ? "+" : ""}{fmt(Math.abs(tx.amount))}
                </p>
                <div className="mt-0.5 flex justify-end">
                  <StatusBadge status={tx.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
