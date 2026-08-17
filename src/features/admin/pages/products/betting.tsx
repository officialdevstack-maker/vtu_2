import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Trophy } from "lucide-react";
import { apiClient } from "@/shared/api/apiClient";
import { extractApiErrorMessage } from "@/shared/utils";
import { Button, Card, EmptyState, PageHeader, StatusBadge, inputCls } from "../../../user/components/shared-ui";

type Provider = {
  id: number; name: string; biller_id: string; active: boolean;
  verification_supported: boolean; minimum_amount: string | number;
  maximum_amount: string | number; flat_fee: string | number; percentage_fee: string | number;
};
type Transaction = { id: number; transaction_reference: string; provider: string; receiver: string; amount: string | number; status: "success" | "pending" | "fail"; created_at: string };
type BettingAdmin = { enabled: boolean; upstream_provider: string; providers: Provider[]; recent_transactions: Transaction[] };
type Envelope<T> = { data: T; message: string };

const service = {
  get: () => apiClient.get<Envelope<BettingAdmin>>("/admin/betting").then((r) => r.data.data),
  settings: (enabled: boolean) => apiClient.put("/admin/betting/settings", { enabled }),
  update: (id: number, values: Partial<Provider>) => apiClient.patch(`/admin/betting/providers/${id}`, values),
  sync: () => apiClient.post("/admin/betting/providers/sync"),
};

export default function AdminBettingPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-betting"], queryFn: service.get });
  const [error, setError] = useState<string | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-betting"] });
  const mutation = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: () => { setError(null); void refresh(); },
    onError: (cause) => setError(extractApiErrorMessage(cause, "Could not update betting settings.")),
  });
  const data = query.data;

  return (
    <div className="space-y-5">
      <PageHeader title="Betting" description="Manage availability, account limits, charges, and supported betting companies" actions={
        <Button variant="secondary" disabled={mutation.isPending} onClick={() => mutation.mutate(service.sync)}>
          <RefreshCw className={`h-4 w-4 ${mutation.isPending ? "animate-spin" : ""}`} /> Sync supported providers
        </Button>
      } />
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-sm font-semibold text-slate-900">Betting funding</p><p className="text-xs text-slate-500">Globally enable only after your upstream account has been authorised.</p></div>
          <button type="button" role="switch" aria-checked={data?.enabled ?? false} disabled={!data || mutation.isPending}
            onClick={() => data && mutation.mutate(() => service.settings(!data.enabled))}
            className={`relative h-6 w-11 rounded-full transition-colors ${data?.enabled ? "bg-emerald-600" : "bg-slate-300"}`}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${data?.enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">Supported companies</h2><p className="text-xs text-slate-500">Newly synchronized companies remain disabled until reviewed.</p></div>
        {query.isPending ? <div className="p-6 text-sm text-slate-400">Loading…</div> : !data?.providers.length ? (
          <EmptyState icon={Trophy} title="No supported companies found" description="Check the upstream credentials and synchronize providers." />
        ) : <div className="divide-y divide-gray-100">{data.providers.map((provider) => <ProviderRow key={provider.id} provider={provider} saving={mutation.isPending} save={(values) => mutation.mutate(() => service.update(provider.id, values))} />)}</div>}
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">Recent betting transactions</h2></div>
        {!data?.recent_transactions.length ? <p className="p-6 text-sm text-slate-400">No betting transactions yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-gray-50 text-slate-500"><tr><th className="px-4 py-2">Reference</th><th className="px-4 py-2">Company</th><th className="px-4 py-2">Customer ID</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2">Status</th></tr></thead><tbody className="divide-y divide-gray-100">{data.recent_transactions.map((tx) => <tr key={tx.id}><td className="px-4 py-3 font-mono">{tx.transaction_reference}</td><td className="px-4 py-3">{tx.provider}</td><td className="px-4 py-3">{tx.receiver}</td><td className="px-4 py-3">₦{Number(tx.amount).toLocaleString()}</td><td className="px-4 py-3"><StatusBadge status={tx.status} /></td></tr>)}</tbody></table></div>
        )}
      </Card>
    </div>
  );
}

function ProviderRow({ provider, saving, save }: { provider: Provider; saving: boolean; save: (values: Partial<Provider>) => void }) {
  const [values, setValues] = useState(provider);
  const number = (key: keyof Provider, value: string) => setValues((old) => ({ ...old, [key]: value }));
  return <div className="space-y-3 p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-900">{provider.name}</p><p className="text-xs text-slate-400">Synced upstream identifier: {provider.biller_id}</p></div><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={values.active} onChange={(e) => setValues({ ...values, active: e.target.checked })} /> Available</label></div><div className="grid grid-cols-2 gap-2 md:grid-cols-4"><input aria-label="Minimum amount" className={inputCls} type="number" value={values.minimum_amount} onChange={(e) => number("minimum_amount", e.target.value)} placeholder="Minimum" /><input aria-label="Maximum amount" className={inputCls} type="number" value={values.maximum_amount} onChange={(e) => number("maximum_amount", e.target.value)} placeholder="Maximum" /><input aria-label="Flat fee" className={inputCls} type="number" value={values.flat_fee} onChange={(e) => number("flat_fee", e.target.value)} placeholder="Flat fee" /><input aria-label="Percentage fee" className={inputCls} type="number" value={values.percentage_fee} onChange={(e) => number("percentage_fee", e.target.value)} placeholder="Percentage fee" /></div><div className="flex justify-end"><Button size="sm" disabled={saving} onClick={() => save(values)}>Save company</Button></div></div>;
}
