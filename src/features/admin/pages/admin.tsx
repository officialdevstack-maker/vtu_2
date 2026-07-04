import {
  Users,
  TrendingUp,
  Wallet,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  Eye,
  Wand2,
  X,
  Phone,
  Wifi,
  Tv,
  Plug,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { fmt } from "../../user/data/mock";
import {
  StatusBadge,
  StatCard,
  PageHeader,
  Card,
  Button,
  ConfirmSummary,
  inputCls,
} from "../../user/components/shared-ui";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const chartValue = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0));

const revenueData = [
  { month: "Jan", revenue: 4200000 },
  { month: "Feb", revenue: 5100000 },
  { month: "Mar", revenue: 4800000 },
  { month: "Apr", revenue: 6300000 },
  { month: "May", revenue: 7100000 },
  { month: "Jun", revenue: 8400000 },
];

const serviceBreakdown = [
  { name: "Airtime", value: 38 },
  { name: "Data", value: 27 },
  { name: "Electricity", value: 18 },
  { name: "Cable TV", value: 10 },
  { name: "Others", value: 7 },
];

const providerBalances = [
  { name: "MTN airtime", icon: Phone, balance: 285000, status: "ok" },
  { name: "Airtel data", icon: Wifi, balance: 42000, status: "low" },
  { name: "DStv / GOtv", icon: Tv, balance: 165000, status: "ok" },
  { name: "Electricity", icon: Plug, balance: 320000, status: "ok" },
];

const recentUsers = [
  {
    id: "USR001",
    name: "Chukwuemeka Obi",
    email: "emeka@gmail.com",
    balance: 45820,
    status: "active",
    kyc: "verified",
    txns: 47,
  },
  {
    id: "USR002",
    name: "Adaeze Nwosu",
    email: "adaeze@outlook.com",
    balance: 12300,
    status: "active",
    kyc: "verified",
    txns: 23,
  },
  {
    id: "USR003",
    name: "Kunle Adeleke",
    email: "kunle@gmail.com",
    balance: 89700,
    status: "active",
    kyc: "pending",
    txns: 112,
  },
  {
    id: "USR004",
    name: "Fatima Bello",
    email: "fatima@yahoo.com",
    balance: 5100,
    status: "suspended",
    kyc: "verified",
    txns: 8,
  },
  {
    id: "USR005",
    name: "Tunde Bakare",
    email: "tunde@gmail.com",
    balance: 0,
    status: "inactive",
    kyc: "unverified",
    txns: 2,
  },
];

const recentTxns = [
  {
    ref: "VTU001",
    user: "Chukwuemeka Obi",
    type: "Airtime",
    amount: 500,
    status: "success",
    date: "Today, 2:30 PM",
  },
  {
    ref: "VTU002",
    user: "Adaeze Nwosu",
    type: "Data",
    amount: 1500,
    status: "success",
    date: "Today, 11:15 AM",
  },
  {
    ref: "VTU003",
    user: "Kunle Adeleke",
    type: "Electricity",
    amount: 5000,
    status: "failed",
    date: "Yesterday, 4:00 PM",
  },
  {
    ref: "VTU004",
    user: "Fatima Bello",
    type: "Cable TV",
    amount: 7900,
    status: "success",
    date: "Yesterday, 2:18 PM",
  },
  {
    ref: "VTU005",
    user: "Tunde Bakare",
    type: "Airtime",
    amount: 1000,
    status: "pending",
    date: "Jun 27, 9:30 AM",
  },
];

type FundTarget = { id: string; name: string } | null;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "transactions"
  >("overview");
  const [userSearch, setUserSearch] = useState("");
  const [txSearch, setTxSearch] = useState("");
  const [fundTarget, setFundTarget] = useState<FundTarget>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundStep, setFundStep] = useState<"form" | "confirm" | "done">("form");

  const filteredUsers = recentUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()),
  );

  const openFunding = (target: { id: string; name: string }) => {
    setFundTarget(target);
    setFundAmount("");
    setFundStep("form");
  };
  const closeFunding = () => setFundTarget(null);

  const lowBalanceProviders = providerBalances.filter(
    (p) => p.status === "low",
  );
  const pendingKyc = recentUsers.filter((u) => u.kyc === "pending");
  const failedTxns = recentTxns.filter((t) => t.status === "failed");

  const alerts = [
    ...lowBalanceProviders.map((p) => ({
      key: `provider-${p.name}`,
      icon: p.icon,
      tone: "danger" as const,
      title: `${p.name} balance is low`,
      description: `${fmt(p.balance)} remaining — fund before it runs out.`,
      actionLabel: "Fund now",
      onAction: () => {},
    })),
    ...pendingKyc.map((u) => ({
      key: `kyc-${u.id}`,
      icon: UserCheck,
      tone: "warning" as const,
      title: `${u.name} — KYC pending review`,
      description: "Verification documents submitted, awaiting approval.",
      actionLabel: "Review",
      onAction: () => setActiveTab("users"),
    })),
    ...failedTxns.map((t) => ({
      key: `txn-${t.ref}`,
      icon: ShieldAlert,
      tone: "danger" as const,
      title: `Failed transaction — ${t.ref}`,
      description: `${t.user} · ${t.type} · ${fmt(t.amount)}`,
      actionLabel: "Investigate",
      onAction: () => setActiveTab("transactions"),
    })),
  ];

  const statCards = [
    {
      label: "Total users",
      value: "12,847",
      meta: "+234 this month",
      icon: Users,
      tone: "neutral" as const,
    },
    {
      label: "Total wallet balance",
      value: "₦142M",
      meta: "Combined across users",
      icon: Wallet,
      tone: "neutral" as const,
    },
    {
      label: "Total sales",
      value: "₦8.4M",
      meta: "+18% vs last month",
      icon: TrendingUp,
      tone: "success" as const,
    },
    {
      label: "Successful transactions",
      value: "34,880",
      meta: "94.8% success rate",
      icon: CheckCircle2,
      tone: "success" as const,
    },
    {
      label: "Failed transactions",
      value: "1,920",
      meta: "Requires attention",
      icon: XCircle,
      tone: "danger" as const,
    },
    {
      label: "Pending issues",
      value: "47",
      meta: "Awaiting review",
      icon: AlertTriangle,
      tone: "warning" as const,
    },
  ];

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
            Last synced 2 minutes ago
          </span>
        </div>
        <button className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Sync now
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
          <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg">
            {(["overview", "users", "transactions"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${activeTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((s) => (
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
                  <div
                    key={a.key}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.tone === "danger" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}
                    >
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
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={a.onAction}
                      className="shrink-0"
                    >
                      {a.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Provider balances */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                API / provider balances
              </h3>
              <Button variant="secondary" size="sm">
                Fund all
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {providerBalances.map((p) => (
                <div
                  key={p.name}
                  className={`p-3 rounded-lg border ${p.status === "low" ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                      <p.icon className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    {p.status === "low" && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 ml-auto" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-600">{p.name}</p>
                  <p
                    className={`font-semibold text-sm mt-1 ${p.status === "low" ? "text-red-600" : "text-slate-900"}`}
                  >
                    {fmt(p.balance)}
                  </p>
                  {p.status === "low" && (
                    <p className="text-xs text-red-500 mt-0.5">Low balance</p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Revenue chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Revenue overview
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
                </div>
                <button className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart
                  data={revenueData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F1F5F9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`}
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
                  <Bar
                    dataKey="revenue"
                    fill="#4f46e5"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3.5">
                Service breakdown
              </h3>
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
            </Card>
          </div>

          {/* Recent transactions */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Recent transactions
              </h3>
              <button
                onClick={() => setActiveTab("transactions")}
                className="text-xs text-indigo-600 font-medium hover:text-indigo-700"
              >
                View all
              </button>
            </div>
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
                    <tr
                      key={tx.ref}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-400 truncate">
                        {tx.ref}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900 text-xs truncate">
                        {tx.user}
                      </td>
                      <td className="hidden lg:table-cell px-3 py-3 text-xs text-slate-500 truncate">
                        {tx.type}
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-slate-900 text-xs tabular-nums whitespace-nowrap">
                        {fmt(tx.amount)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-right text-xs text-slate-400 whitespace-nowrap">
                        {tx.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === "users" && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              User management
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users"
                  className={`${inputCls} pl-9 py-2 w-52`}
                />
              </div>
              <Button variant="secondary" size="sm">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed min-w-[560px] lg:min-w-0">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-[24%] px-4 py-2 text-left text-xs font-medium text-slate-500">User</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Email</th>
                  <th className="hidden lg:table-cell w-[12%] px-4 py-2 text-right text-xs font-medium text-slate-500">Balance</th>
                  <th className="hidden lg:table-cell w-[9%] px-4 py-2 text-right text-xs font-medium text-slate-500">Txns</th>
                  <th className="hidden lg:table-cell w-[11%] px-4 py-2 text-left text-xs font-medium text-slate-500">KYC</th>
                  <th className="w-[14%] px-4 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="w-16 px-2 py-2 text-center text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                          {u.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <span className="font-medium text-slate-900 text-xs truncate">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 truncate">
                      {u.email}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-right font-medium text-slate-900 text-xs tabular-nums whitespace-nowrap">
                      {fmt(u.balance)}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-right text-xs text-slate-500">
                      {u.txns}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      <StatusBadge status={u.kyc} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            openFunding({ id: u.id, name: u.name })
                          }
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Fund wallet"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "transactions" && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-slate-900">
              All transactions
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Search"
                  className={`${inputCls} pl-9 py-2 w-52`}
                />
              </div>
              <Button variant="secondary" size="sm">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed min-w-[440px] lg:min-w-0">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-[22%] px-4 py-2 text-left text-xs font-medium text-slate-500">Reference</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">User</th>
                  <th className="hidden lg:table-cell w-[14%] px-4 py-2 text-left text-xs font-medium text-slate-500">Type</th>
                  <th className="w-[18%] px-4 py-2 text-right text-xs font-medium text-slate-500">Amount</th>
                  <th className="w-[16%] px-4 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                  <th className="hidden lg:table-cell w-[14%] px-4 py-2 text-left text-xs font-medium text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTxns
                  .filter(
                    (tx) =>
                      tx.user.toLowerCase().includes(txSearch.toLowerCase()) ||
                      tx.ref.includes(txSearch),
                  )
                  .map((tx) => (
                    <tr
                      key={tx.ref}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-400 truncate">
                        {tx.ref}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 text-xs truncate">
                        {tx.user}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-xs text-slate-500 truncate">
                        {tx.type}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900 text-xs tabular-nums whitespace-nowrap">
                        {fmt(tx.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {tx.date}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Manual funding modal */}
      {fundTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">
                Fund user wallet
              </h3>
              <button
                onClick={closeFunding}
                className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {fundStep === "form" && (
              <div className="p-4 space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5">
                  <p className="text-xs text-slate-500">Crediting wallet for</p>
                  <p className="text-sm font-medium text-slate-900">
                    {fundTarget.name}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Amount to credit
                  </label>
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="Enter amount"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Reason
                  </label>
                  <select className={inputCls} defaultValue="manual-credit">
                    <option value="manual-credit">
                      Manual credit / support request
                    </option>
                    <option value="reversal">
                      Failed transaction reversal
                    </option>
                    <option value="promo">Promotional credit</option>
                  </select>
                </div>
                <Button
                  fullWidth
                  disabled={!fundAmount || Number(fundAmount) <= 0}
                  onClick={() => setFundStep("confirm")}
                >
                  Review and confirm
                </Button>
              </div>
            )}

            {fundStep === "confirm" && (
              <div className="p-4">
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3.5 py-2.5 mb-4 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    This action credits the user's wallet immediately and cannot
                    be undone automatically.
                  </p>
                </div>
                <ConfirmSummary
                  title=""
                  rows={[
                    { label: "User", value: fundTarget.name },
                    { label: "Amount", value: fmt(Number(fundAmount)) },
                  ]}
                />
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setFundStep("form")}
                  >
                    Back
                  </Button>
                  <Button fullWidth onClick={() => setFundStep("done")}>
                    Confirm & credit
                  </Button>
                </div>
              </div>
            )}

            {fundStep === "done" && (
              <div className="p-6 text-center">
                <div className="w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-slate-900 mb-1">
                  Wallet credited
                </p>
                <p className="text-sm text-slate-500 mb-5">
                  {fmt(Number(fundAmount))} was added to {fundTarget.name}'s
                  wallet.
                </p>
                <Button fullWidth onClick={closeFunding}>
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
