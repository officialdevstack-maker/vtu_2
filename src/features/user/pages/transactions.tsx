import { useState } from "react";
import { Search, Download, X, RefreshCw, Receipt } from "lucide-react";
import { transactions, fmt, serviceLabels, type ServiceType, type Period } from "../data/mock";
import { StatusBadge, PageHeader, Card, Button, EmptyState, inputCls } from "../components/shared-ui";
import type { Transaction } from "../data/mock";

const periodLabels: Record<Period, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This week",
  earlier: "Earlier",
};

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [service, setService] = useState<ServiceType | "all">("all");
  const [period, setPeriod] = useState<Period | "all">("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase();
    return (
      (tx.desc.toLowerCase().includes(q) ||
        tx.detail.toLowerCase().includes(q) ||
        tx.ref.toLowerCase().includes(q)) &&
      (status === "all" || tx.status === status) &&
      (service === "all" || tx.service === service) &&
      (period === "all" || tx.period === period)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <PageHeader title="Transactions" description="Every payment made from your wallet" />

      <Card className="p-3.5">
        <div className="flex flex-col lg:flex-row gap-2.5">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by description or reference"
              className={`${inputCls} pl-9`}
            />
          </div>
          <select value={service} onChange={(e) => setService(e.target.value as ServiceType | "all")} className={`${inputCls} lg:w-40`}>
            <option value="all">All services</option>
            {Object.entries(serviceLabels).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period | "all")} className={`${inputCls} lg:w-36`}>
            <option value="all">All time</option>
            {Object.entries(periodLabels).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <div className="flex gap-1.5">
            {["all", "success", "pending", "failed"].map((f) => (
              <button
                key={f}
                onClick={() => setStatus(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors capitalize whitespace-nowrap ${
                  status === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-slate-600 hover:bg-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-slate-500 text-xs">
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
          </p>
          <button className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions found" description="Try adjusting your search or filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Transaction</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Reference</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-slate-500">Amount</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Status</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((tx) => (
                  <tr key={tx.id} onClick={() => setSelectedTx(tx)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <tx.icon className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-900 font-medium truncate">{tx.desc}</p>
                          <p className="text-slate-400 text-xs truncate">{tx.detail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-400 text-xs font-mono">{tx.ref}</td>
                    <td className={`px-3 py-3 text-right font-medium tabular-nums ${tx.amount > 0 ? "text-emerald-600" : "text-slate-900"}`}>
                      {tx.amount > 0 ? "+" : ""}{fmt(Math.abs(tx.amount))}
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={tx.status} /></td>
                    <td className="px-4 py-3 text-right text-slate-400 text-xs whitespace-nowrap">{tx.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-lg">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Transaction details</h3>
              <button onClick={() => setSelectedTx(null)} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex flex-col items-center mb-5 pb-5 border-b border-gray-100">
                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <selectedTx.icon className="w-5 h-5 text-slate-500" />
                </div>
                <p className={`text-xl font-semibold ${selectedTx.amount > 0 ? "text-emerald-600" : "text-slate-900"}`}>
                  {selectedTx.amount > 0 ? "+" : ""}{fmt(Math.abs(selectedTx.amount))}
                </p>
                <p className="text-slate-500 text-sm mt-1">{selectedTx.desc}</p>
                <div className="mt-2"><StatusBadge status={selectedTx.status} /></div>
              </div>
              <div className="space-y-2.5 text-sm">
                {(
                  [
                    ["Reference", selectedTx.ref],
                    ["Recipient", selectedTx.detail],
                    ["Date & time", selectedTx.date],
                    ["Transaction fee", "Free"],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-900 font-medium text-right">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <Button variant="secondary" fullWidth onClick={() => setSelectedTx(null)}>
                  <Download className="w-4 h-4" /> Receipt
                </Button>
                {selectedTx.status === "failed" && (
                  <Button fullWidth>
                    <RefreshCw className="w-4 h-4" /> Retry
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
