import { useState } from "react";
import { Search, Plus, Send, MoreHorizontal, Users } from "lucide-react";
import { beneficiaries } from "../data/mock";
import { PageHeader, Card, Button, EmptyState, inputCls } from "../components/shared-ui";

export default function BeneficiariesPage() {
  const [search, setSearch] = useState("");
  const filtered = beneficiaries.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.phone ?? "").includes(search)
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader
        title="Beneficiaries"
        description="Saved recipients for faster payments"
        actions={<Button><Plus className="w-4 h-4" /> Add</Button>}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search beneficiaries"
          className={`${inputCls} pl-9`}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100">
          <p className="text-slate-500 text-xs">
            {filtered.length} saved recipient{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No beneficiaries found" action={<button className="text-[#111827] text-sm font-medium">Add your first beneficiary</button>} />
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((b) => (
              <div key={b.id} className="flex items-center gap-3.5 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${b.color}`}>
                  {b.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 text-sm font-medium">{b.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {b.type === "bank" ? `${b.bank} · ${b.account}` : `${b.network} · ${b.phone}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${b.type === "bank" ? "bg-teal-50 text-teal-700" : "bg-[#111827]/10 text-[#111827]"}`}>
                    {b.type === "bank" ? "Bank" : b.type === "airtime" ? "Airtime" : "Data"}
                  </span>
                  <button className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
