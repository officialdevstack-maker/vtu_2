import { useState } from "react";
import { Search, Download, X, RefreshCw, Receipt } from "lucide-react";
import { transactions, fmt } from "../data/mock";
import { StatusBadge } from "../components/shared-ui";
import type { Transaction } from "../data/mock";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase();
    return (
      (tx.desc.toLowerCase().includes(q) ||
        tx.detail.toLowerCase().includes(q) ||
        tx.ref.toLowerCase().includes(q)) &&
      (filter === "all" || tx.status === filter)
    );
  });

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-4xl mx-auto space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions\u2026"
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex gap-1.5">
            {["all", "success", "pending", "failed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition capitalize ${
                  filter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-gray-500 text-xs">
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
          </p>
          <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No transactions found</p>
            <p className="text-gray-400 text-xs mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.amount > 0 ? "bg-emerald-50" : "bg-gray-100"}`}>
                  <tx.icon className={`w-5 h-5 ${tx.amount > 0 ? "text-emerald-600" : "text-gray-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-gray-900 text-sm font-medium">{tx.desc}</p>
                    <StatusBadge status={tx.status} />
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">{tx.detail} \u00b7 {tx.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${tx.amount > 0 ? "text-emerald-600" : "text-gray-900"}`}>
                    {tx.amount > 0 ? "+" : ""}{fmt(Math.abs(tx.amount))}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5 font-mono">{tx.ref}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Transaction Details</h3>
              <button onClick={() => setSelectedTx(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex flex-col items-center mb-5 pb-5 border-b border-gray-100">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${selectedTx.amount > 0 ? "bg-emerald-50" : "bg-gray-100"}`}>
                  <selectedTx.icon className={`w-7 h-7 ${selectedTx.amount > 0 ? "text-emerald-600" : "text-gray-500"}`} />
                </div>
                <p className={`text-2xl font-semibold ${selectedTx.amount > 0 ? "text-emerald-600" : "text-gray-900"}`}>
                  {selectedTx.amount > 0 ? "+" : ""}{fmt(Math.abs(selectedTx.amount))}
                </p>
                <p className="text-gray-500 text-sm mt-1">{selectedTx.desc}</p>
                <div className="mt-2"><StatusBadge status={selectedTx.status} /></div>
              </div>
              <div className="space-y-3 text-sm">
                {(
                  [
                    ["Reference", selectedTx.ref],
                    ["Recipient", selectedTx.detail],
                    ["Date & Time", selectedTx.date],
                    ["Transaction Fee", "Free"],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-500">{k}</span>
                    <span className="text-gray-900 font-medium text-right">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setSelectedTx(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Receipt
                </button>
                {selectedTx.status === "failed" && (
                  <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-1.5">
                    <RefreshCw className="w-4 h-4" /> Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

