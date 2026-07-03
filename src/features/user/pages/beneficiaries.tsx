import { useState } from "react";
import { Search, Plus, Send, MoreHorizontal, Users } from "lucide-react";
import { beneficiaries } from "../data/mock";

export default function BeneficiariesPage() {
  const [search, setSearch] = useState("");
  const filtered = beneficiaries.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.phone ?? "").includes(search)
  );

  return (
    <div className="p-6 pb-24 lg:pb-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search beneficiaries\u2026"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition shrink-0">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <p className="text-gray-500 text-xs">
            {filtered.length} saved recipient{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">No beneficiaries found</p>
            <button className="mt-3 text-indigo-600 text-sm font-medium">Add your first beneficiary</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${b.color}`}>
                  {b.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-medium">{b.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {b.type === "bank" ? `${b.bank} \u00b7 ${b.account}` : `${b.network} \u00b7 ${b.phone}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.type === "bank" ? "bg-teal-50 text-teal-700" : "bg-indigo-50 text-indigo-700"}`}>
                    {b.type === "bank" ? "Bank" : b.type === "airtime" ? "Airtime" : "Data"}
                  </span>
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                    <Send className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
