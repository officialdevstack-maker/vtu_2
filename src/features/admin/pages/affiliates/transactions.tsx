import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search, Wallet2 } from "lucide-react";
import {
  Card,
  EmptyState,
  Pagination,
  SkeletonRows,
  StatusBadge,
  selectCls,
  inputCls,
} from "../../../user/components/shared-ui";
import { DEFAULT_PAGE_SIZE } from "@shared/pagination";
import { useLocalStorageState } from "@/shared/utils";
import {
  childTransactionService,
  type ChildTransaction,
  type PaginatedMeta,
} from "./service";
import { useAffiliate } from "./affiliate-layout";
import { fmt } from "./modals";

type TransactionSortKey =
  "external_id" | "transaction_type" | "amount" | "status" | "created_at";

type TransactionSortState = {
  key: TransactionSortKey;
  direction: "asc" | "desc";
};

export default function AffiliateTransactionsPage() {
  const { instance } = useAffiliate();
  const id = String(instance.id);

  const [transactions, setTransactions] = useState<ChildTransaction[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useLocalStorageState<string>(
    `affiliate:${id}:transactions:typeFilter`,
    "all",
  );
  const [query, setQuery] = useLocalStorageState<string>(
    `affiliate:${id}:transactions:query`,
    "",
  );
  const [statusFilter, setStatusFilter] = useLocalStorageState<string>(
    `affiliate:${id}:transactions:statusFilter`,
    "all",
  );
  const [sort, setSort] = useLocalStorageState<TransactionSortState>(
    `affiliate:${id}:transactions:sort`,
    { key: "created_at", direction: "desc" },
  );
  const [page, setPage] = useLocalStorageState<number>(
    `affiliate:${id}:transactions:page`,
    1,
  );

  const toggleSort = (key: TransactionSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
    setPage(1);
  };

  useEffect(() => {
    setLoading(true);
    childTransactionService
      .getPaginatedByInstance(id, {
        query: query.trim() || undefined,
        sort: `${sort.key},${sort.direction}`,
        page,
        per_page: DEFAULT_PAGE_SIZE,
        transaction_type: typeFilter === "all" ? undefined : typeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
      })
      .then(({ data, meta: nextMeta }) => {
        setTransactions(data);
        setMeta(nextMeta);
      })
      .finally(() => setLoading(false));
  }, [id, query, sort, typeFilter, statusFilter, page]);

  const types = useMemo(
    () =>
      [
        typeFilter !== "all" ? typeFilter : undefined,
        ...new Set(transactions.map((t) => t.transaction_type).filter(Boolean)),
      ].filter(Boolean) as string[],
    [transactions, typeFilter],
  );
  const statuses = useMemo(
    () =>
      [
        statusFilter !== "all" ? statusFilter : undefined,
        ...new Set(transactions.map((t) => t.status).filter(Boolean)),
      ].filter(Boolean) as string[],
    [transactions, statusFilter],
  );

  const volume = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const pageItems = transactions;
  const currentPage = meta?.current_page ?? page;
  const totalPages = meta?.last_page ?? 1;
  const totalItems = meta?.total ?? transactions.length;
  const pageSize = meta?.per_page ?? DEFAULT_PAGE_SIZE;

  return (
    <Card>
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3 flex-wrap">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Transactions{" "}
          {totalItems > 0 && (
            <span className="text-slate-400 normal-case font-normal">
              — {currentPage ? `${currentPage}` : "1"} of {totalItems} shown · {fmt(volume)} total
            </span>
          )}
        </h2>
        <div className="ml-auto flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search ID, type or status…"
              className={`${inputCls} pl-8 w-full`}
            />
          </div>
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
              <option key={t} value={t}>
                {t}
              </option>
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
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-5">
          <SkeletonRows count={6} withAvatar={false} />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={Wallet2}
          title={
            transactions.length === 0
              ? "No synced transactions yet"
              : "Nothing matches these filters"
          }
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
                  <th className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600"
                      onClick={() => toggleSort("external_id")}
                    >
                      External ID
                      {sort.key === "external_id" &&
                        (sort.direction === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ))}
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600"
                      onClick={() => toggleSort("transaction_type")}
                    >
                      Type
                      {sort.key === "transaction_type" &&
                        (sort.direction === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ))}
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600"
                      onClick={() => toggleSort("amount")}
                    >
                      Amount
                      {sort.key === "amount" &&
                        (sort.direction === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ))}
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600"
                      onClick={() => toggleSort("status")}
                    >
                      Status
                      {sort.key === "status" &&
                        (sort.direction === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ))}
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600"
                      onClick={() => toggleSort("created_at")}
                    >
                      Synced
                      {sort.key === "created_at" &&
                        (sort.direction === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ))}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageItems.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {t.external_id}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {t.transaction_type ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 tabular-nums">
                      {fmt(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status ?? "pending"} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {t.created_at
                        ? new Date(t.created_at).toLocaleString()
                        : "—"}
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
