import { useEffect, useMemo, useState } from "react";
import { Wallet2 } from "lucide-react";
import {
  Card,
  EmptyState,
  Pagination,
  SkeletonRows,
  StatusBadge,
  selectCls,
} from "../../../user/components/shared-ui";
import { usePagination } from "@shared/pagination";
import { childTransactionService, type ChildTransaction } from "./service";
import { useAffiliate } from "./affiliate-layout";
import { fmt } from "./modals";

export default function AffiliateTransactionsPage() {
  const { instance } = useAffiliate();
  const id = String(instance.id);

  const [transactions, setTransactions] = useState<ChildTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    childTransactionService
      .getByInstance(id)
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, [id]);

  const types = useMemo(
    () => [...new Set(transactions.map((t) => t.transaction_type).filter(Boolean))] as string[],
    [transactions],
  );
  const statuses = useMemo(
    () => [...new Set(transactions.map((t) => t.status).filter(Boolean))] as string[],
    [transactions],
  );

  const filtered = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (typeFilter === "all" || t.transaction_type === typeFilter) &&
          (statusFilter === "all" || t.status === statusFilter),
      ),
    [transactions, typeFilter, statusFilter],
  );

  const volume = filtered.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const { pageItems, currentPage, totalPages, totalItems, pageSize, setPage } =
    usePagination(filtered);

  return (
    <Card>
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Transactions{" "}
          {filtered.length > 0 && (
            <span className="text-slate-400 normal-case font-normal">
              — {filtered.length} shown · {fmt(volume)} total
            </span>
          )}
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className={selectCls}
          >
            <option value="all">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={selectCls}
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-5">
          <SkeletonRows count={6} withAvatar={false} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Wallet2}
          title={transactions.length === 0 ? "No synced transactions yet" : "Nothing matches these filters"}
          description={
            transactions.length === 0
              ? "They'll appear here once the affiliate's cron pushes a batch."
              : "Try widening the type or status filter."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {["External ID", "Type", "Amount", "Status", "Synced"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageItems.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500">{t.external_id}</td>
                    <td className="px-4 py-3 text-slate-700">{t.transaction_type ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-700 tabular-nums">{fmt(t.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status ?? "pending"} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {t.created_at ? new Date(t.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            label="transactions"
          />
        </>
      )}
    </Card>
  );
}
