import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Eye, EyeOff, ArrowDownLeft,
  Plus, ChevronRight, Wallet, Phone, Wifi, Tv, Plug, RefreshCw,
  CheckCircle, Activity, Copy,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { fmt, chartValue, mockUser, spendingData, transactions } from "../data/mock";
import { SkeletonLine, SkeletonCard, StatusBadge } from "../components/shared-ui";

const networkStatus = [
  { name: "MTN", color: "#FBBF24", status: "operational", uptime: "99.9%", icon: "M" },
  { name: "Airtel", color: "#EF4444", status: "operational", uptime: "99.7%", icon: "A" },
  { name: "Glo", color: "#22C55E", status: "operational", uptime: "98.2%", icon: "G" },
  { name: "9mobile", color: "#22D3EE", status: "degraded", uptime: "94.1%", icon: "9" },
];

const quickActions = [
  { label: "Buy Airtime", icon: Phone, path: "/buy-airtime", color: "bg-blue-50 text-blue-600", border: "border-blue-100 hover:border-blue-300 hover:bg-blue-50" },
  { label: "Buy Data", icon: Wifi, path: "/buy-data", color: "bg-indigo-50 text-indigo-600", border: "border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50" },
  { label: "Fund Wallet", icon: Wallet, path: "/wallet", color: "bg-emerald-50 text-emerald-600", border: "border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50" },
  { label: "Electricity", icon: Plug, path: "/electricity", color: "bg-yellow-50 text-yellow-600", border: "border-yellow-100 hover:border-yellow-300 hover:bg-yellow-50" },
  { label: "Cable TV", icon: Tv, path: "/cable-tv", color: "bg-purple-50 text-purple-600", border: "border-purple-100 hover:border-purple-300 hover:bg-purple-50" },
];

const statCards = [
  {
    label: "Wallet Balance", value: mockUser.balance, format: "currency",
    icon: Wallet, color: "text-indigo-600", bg: "bg-indigo-50",
    change: "+₦5,000", changeType: "up", sub: "Available balance",
  },
  {
    label: "Total Deposits", value: 245000, format: "currency",
    icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-50",
    change: "+12.4%", changeType: "up", sub: "This month",
  },
  {
    label: "Total Transactions", value: 128, format: "number",
    icon: Activity, color: "text-blue-600", bg: "bg-blue-50",
    change: "+8", changeType: "up", sub: "This month",
  },
  {
    label: "Successful", value: 121, format: "number",
    icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50",
    change: "94.5% rate", changeType: "up", sub: "Of total transactions",
  },
];

export default function DashboardPage() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonLine className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{greeting}, Chukwuemeka 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {now.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => navigate("/wallet")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-md shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          Fund Wallet
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</p>
              <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>
                <s.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1.5">
              {i === 0 ? (
                <>
                  <span className="text-2xl font-bold text-gray-900">
                    {balanceVisible ? fmt(s.value) : "\u20A6 \u2022\u2022\u2022\u2022\u2022\u2022"}
                  </span>
                  <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-gray-400 hover:text-gray-600 mb-1">
                    {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-900">
                  {s.format === "currency" ? fmt(s.value) : s.value.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {s.changeType === "up" ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className={`text-xs font-semibold ${s.changeType === "up" ? "text-emerald-600" : "text-red-500"}`}>
                {s.change}
              </span>
              <span className="text-xs text-gray-400">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Balance Card + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Balance hero card */}
        <div className="lg:col-span-2 rounded-2xl p-6 relative overflow-hidden text-white bg-brand-gradient">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 right-20 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-2">Total Balance</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold tracking-tight">
                    {balanceVisible ? fmt(mockUser.balance) : "\u20A6 \u2022\u2022\u2022\u2022\u2022\u2022"}
                  </span>
                  <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-indigo-200 hover:text-white transition mt-1">
                    {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Active
              </div>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-indigo-200 text-sm font-mono">{mockUser.accountNumber}</span>
              <button
                className="text-indigo-300 hover:text-white transition"
                onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                <p className="text-indigo-200 text-xs mb-1">Spent this month</p>
                <p className="text-white font-bold">{fmt(23350)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                <p className="text-indigo-200 text-xs mb-1">Received this month</p>
                <p className="text-white font-bold">{fmt(35000)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group ${a.border}`}
              >
                <div className={`w-9 h-9 ${a.color} rounded-lg flex items-center justify-center shrink-0`}>
                  <a.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{a.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-indigo-400 transition" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart + Network Status */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Spending chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Spending Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 days activity</p>
            </div>
            <div className="flex gap-1 bg-gray-50 p-1 rounded-lg">
              {["7D", "1M", "3M"].map((p, i) => (
                <button key={p} className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${i === 0 ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-700"}`}>{p}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={175}>
            <AreaChart data={spendingData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `\u20A6${v / 1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", fontSize: "12px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }} formatter={(v) => [fmt(chartValue(v)), "Spent"]} />
              <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={2.5} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Network Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Network Status</h3>
            <button className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="space-y-3">
            {networkStatus.map((n) => (
              <div key={n.name} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm" style={{ background: n.color }}>
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-900">{n.name}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${n.status === "operational" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {n.status === "operational" ? "Online" : "Degraded"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: n.uptime, background: n.status === "operational" ? "#22C55E" : "#F59E0B" }} />
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{n.uptime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Recent Transactions</h3>
            <p className="text-xs text-gray-400 mt-0.5">{transactions.length} transactions this month</p>
          </div>
          <button
            onClick={() => navigate("/transactions")}
            className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {transactions.slice(0, 6).map((tx) => (
            <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition cursor-pointer">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.amount > 0 ? "bg-emerald-50" : "bg-indigo-50"}`}>
                <tx.icon className={`w-5 h-5 ${tx.amount > 0 ? "text-emerald-600" : "text-indigo-600"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{tx.desc}</p>
                <p className="text-xs text-gray-400 truncate">{tx.detail} \u00b7 {tx.date}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${tx.amount > 0 ? "text-emerald-600" : "text-gray-900"}`}>
                  {tx.amount > 0 ? "+" : ""}{fmt(Math.abs(tx.amount))}
                </p>
                <div className="mt-0.5">
                  <StatusBadge status={tx.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

