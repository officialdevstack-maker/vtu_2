import {
  Users, TrendingUp, Wallet, Receipt, CheckCircle, XCircle,
  Activity, AlertTriangle, Download, Search, MoreHorizontal,
  Phone, Wifi, Tv, Plug, Eye,
} from "lucide-react";
import { useState } from "react";
import { fmt } from "../data/mock";
import { StatusBadge } from "../components/shared-ui";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";

const chartValue = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0));

const revenueData = [
  { month: "Jan", revenue: 4200000, transactions: 18420 },
  { month: "Feb", revenue: 5100000, transactions: 22300 },
  { month: "Mar", revenue: 4800000, transactions: 20100 },
  { month: "Apr", revenue: 6300000, transactions: 27400 },
  { month: "May", revenue: 7100000, transactions: 31200 },
  { month: "Jun", revenue: 8400000, transactions: 36800 },
];

const serviceBreakdown = [
  { name: "Airtime", value: 38, color: "#4F46E5" },
  { name: "Data", value: 27, color: "#10B981" },
  { name: "Electricity", value: 18, color: "#F59E0B" },
  { name: "Cable TV", value: 10, color: "#8B5CF6" },
  { name: "Others", value: 7, color: "#6B7280" },
];

const providerBalances = [
  { name: "MTN Airtime", icon: Phone, color: "bg-yellow-50 text-yellow-600", balance: 285000, status: "ok", threshold: 100000 },
  { name: "Airtel Data", icon: Wifi, color: "bg-red-50 text-red-600", balance: 42000, status: "low", threshold: 100000 },
  { name: "DStv/GOtv", icon: Tv, color: "bg-blue-50 text-blue-600", balance: 165000, status: "ok", threshold: 50000 },
  { name: "Electricity", icon: Plug, color: "bg-yellow-50 text-yellow-600", balance: 320000, status: "ok", threshold: 100000 },
];

const recentUsers = [
  { id: "USR001", name: "Chukwuemeka Obi", email: "emeka@gmail.com", balance: 45820, status: "active", kyc: "verified", joined: "Mar 2024", txns: 47 },
  { id: "USR002", name: "Adaeze Nwosu", email: "adaeze@outlook.com", balance: 12300, status: "active", kyc: "verified", joined: "Apr 2024", txns: 23 },
  { id: "USR003", name: "Kunle Adeleke", email: "kunle@gmail.com", balance: 89700, status: "active", kyc: "pending", joined: "Jan 2024", txns: 112 },
  { id: "USR004", name: "Fatima Bello", email: "fatima@yahoo.com", balance: 5100, status: "suspended", kyc: "verified", joined: "May 2024", txns: 8 },
  { id: "USR005", name: "Tunde Bakare", email: "tunde@gmail.com", balance: 0, status: "inactive", kyc: "unverified", joined: "Jun 2024", txns: 2 },
];

const recentTxns = [
  { ref: "VTU001", user: "Chukwuemeka Obi", type: "Airtime", amount: 500, status: "success", date: "Today, 2:30 PM" },
  { ref: "VTU002", user: "Adaeze Nwosu", type: "Data", amount: 1500, status: "success", date: "Today, 11:15 AM" },
  { ref: "VTU003", user: "Kunle Adeleke", type: "Electricity", amount: 5000, status: "failed", date: "Yesterday, 4:00 PM" },
  { ref: "VTU004", user: "Fatima Bello", type: "Cable TV", amount: 7900, status: "success", date: "Yesterday, 2:18 PM" },
  { ref: "VTU005", user: "Tunde Bakare", type: "Airtime", amount: 1000, status: "pending", date: "Jun 27, 9:30 AM" },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "transactions">("overview");
  const [userSearch, setUserSearch] = useState("");
  const [txSearch, setTxSearch] = useState("");

  const filteredUsers = recentUsers.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const statCards = [
    { label: "Total Users", value: "12,847", change: "+234 this month", icon: Users, bg: "bg-indigo-50", color: "text-indigo-600" },
    { label: "Total Revenue", value: "\u20A68.4M", change: "+18% vs last month", icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Wallet Balances", value: "\u20A6142M", change: "Combined user walances", icon: Wallet, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Transactions", value: "36,800", change: "This month", icon: Receipt, bg: "bg-purple-50", color: "text-purple-600" },
    { label: "Success Rate", value: "94.8%", change: "+1.2% vs last month", icon: CheckCircle, bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Failed Txns", value: "1,920", change: "Require attention", icon: XCircle, bg: "bg-red-50", color: "text-red-600" },
    { label: "Total Deposits", value: "\u20A6245M", change: "This month", icon: Activity, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Pending Issues", value: "47", change: "Requires review", icon: AlertTriangle, bg: "bg-orange-50", color: "text-orange-600" },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Platform overview and management</p>
        </div>
        <div className="flex gap-2">
          {(["overview", "users", "transactions"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${activeTab === t ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide leading-tight">{s.label}</p>
                  <div className={`w-8 h-8 ${s.bg} ${s.color} rounded-lg flex items-center justify-center shrink-0`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.change}</p>
              </div>
            ))}
          </div>

          {/* Provider balances - LOW BALANCE ALERTS */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">API / Provider Balances</h3>
              <button className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">Fund All</button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {providerBalances.map((p) => (
                <div key={p.name} className={`p-4 rounded-xl border ${p.status === "low" ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 ${p.color} rounded-lg flex items-center justify-center`}>
                      <p.icon className="w-4 h-4" />
                    </div>
                    {p.status === "low" && <AlertTriangle className="w-3.5 h-3.5 text-red-500 ml-auto" />}
                  </div>
                  <p className="text-xs font-semibold text-gray-700">{p.name}</p>
                  <p className={`font-bold text-sm mt-1 ${p.status === "low" ? "text-red-600" : "text-gray-900"}`}>{fmt(p.balance)}</p>
                  {p.status === "low" && <p className="text-xs text-red-500 mt-0.5 font-medium">LOW BALANCE</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Revenue chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Revenue Overview</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
                </div>
                <button className="text-xs text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-700">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `\u20A6${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "12px", fontSize: "12px" }} formatter={(v) => [fmt(chartValue(v)), "Revenue"]} />
                  <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Service Breakdown</h3>
              <div className="space-y-3">
                {serviceBreakdown.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700">{s.name}</span>
                      <span className="text-gray-500">{s.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Recent Transactions</h3>
              <button onClick={() => setActiveTab("transactions")} className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Reference</th>
                    <th className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="text-right px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentTxns.map((tx) => (
                    <tr key={tx.ref} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{tx.ref}</td>
                      <td className="px-3 py-3.5 font-semibold text-gray-900 text-xs">{tx.user}</td>
                      <td className="px-3 py-3.5 text-xs text-gray-500">{tx.type}</td>
                      <td className="px-3 py-3.5 text-right font-bold text-gray-900 text-xs">{fmt(tx.amount)}</td>
                      <td className="px-3 py-3.5"><StatusBadge status={tx.status} /></td>
                      <td className="px-5 py-3.5 text-right text-xs text-gray-400">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "users" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
            <h3 className="text-sm font-bold text-gray-900">User Management</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search users..." className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition" />
              </div>
              <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"><Download className="w-4 h-4" /> Export</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["User", "Email", "Balance", "Transactions", "KYC", "Status", "Actions"].map((h) => (
                    <th key={h} className={`px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide ${h === "Balance" || h === "Transactions" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                          {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-semibold text-gray-900 text-xs">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{u.email}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900 text-xs">{fmt(u.balance)}</td>
                    <td className="px-4 py-3.5 text-right text-xs text-gray-500">{u.txns}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={u.kyc} /></td>
                    <td className="px-4 py-3.5"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition"><Eye className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
            <h3 className="text-sm font-bold text-gray-900">All Transactions</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={txSearch} onChange={(e) => setTxSearch(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition" />
              </div>
              <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"><Download className="w-4 h-4" /> Export</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Reference", "User", "Type", "Amount", "Status", "Date"].map((h) => (
                    <th key={h} className={`px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide ${h === "Amount" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTxns.filter((tx) => tx.user.toLowerCase().includes(txSearch.toLowerCase()) || tx.ref.includes(txSearch)).map((tx) => (
                  <tr key={tx.ref} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{tx.ref}</td>
                    <td className="px-4 py-3.5 font-semibold text-gray-900 text-xs">{tx.user}</td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{tx.type}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-gray-900 text-xs">{fmt(tx.amount)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={tx.status} /></td>
                    <td className="px-4 py-3.5 text-xs text-gray-400">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
