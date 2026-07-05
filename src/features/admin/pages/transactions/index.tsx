import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  Inbox,
  Loader2,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  Search,
  Undo2,
  Wallet2,
  X,
  XCircle,
} from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  SkeletonRows,
  SkeletonStatGrid,
  StatCard,
  inputCls,
  selectCls,
} from "../../../user/components/shared-ui";
<<<<<<< HEAD
import {
  transactionService,
  transactionTypeLabels,
  transactionStatusLabels,
  REFUNDABLE_TYPES,
  type Transaction,
  type TransactionType,
  type TransactionStatus,
} from "./service";
=======
import { usePagination } from "../../../../shared/pagination";
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571

type FilterValue<T extends string> = "All" | T;
type DateFilter = "All time" | "Today" | "Last 7 days" | "Last 30 days";
type Toast = { id: number; tone: "success" | "error"; message: string };

<<<<<<< HEAD
function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    const validationErrors = data?.errors;
    if (
      validationErrors &&
      !Array.isArray(validationErrors) &&
      Object.keys(validationErrors).length > 0
    ) {
      return Object.values(validationErrors).flat().join(" ");
    }
    if (typeof data?.message === "string") {
      return data.message;
    }
    if (err.message) return err.message;
  }
  return "Something went wrong. Please try again.";
}

const isRefundable = (tx: Transaction) =>
  tx.status === "success" &&
  !tx.refunded_at &&
  REFUNDABLE_TYPES.includes(tx.transaction_type);

const PAGE_SIZE = 10;
=======
const baseDate = new Date("2026-07-04T15:30:00+01:00");
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571

const fmt = (value: string | number) => {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `₦${(Number.isFinite(n) ? n : 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const dateLabel = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

const daysAgo = (value: string) =>
  Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24));

const statusTone: Record<TransactionStatus, string> = {
  success: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  fail: "bg-red-50 text-red-700",
};

const statusDot: Record<TransactionStatus, string> = {
  success: "bg-emerald-500",
  pending: "bg-amber-500",
  fail: "bg-red-500",
};

const TransactionStatusBadge = ({ status }: { status: TransactionStatus }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[status]}`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${statusDot[status]}`} />
    {transactionStatusLabels[status]}
  </span>
);

const SelectFilter = <T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: FilterValue<T> | string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) => (
  <select
    aria-label={label}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className={`${selectCls} h-10 py-2 text-xs lg:w-40`}
  >
    {options.map((option) => (
      <option key={option} value={option}>
        {option === "All" ? `All ${label.toLowerCase()}` : (labels?.[option] ?? option)}
      </option>
    ))}
  </select>
);

const csvEscape = (value: string) =>
  /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const exportCsv = (rows: Transaction[]) => {
  const header = [
    "Reference",
    "Customer",
    "Email",
    "Type",
    "Provider",
    "Amount",
    "Fee",
    "Status",
    "Recipient",
    "Date",
  ];
  const lines = rows.map((tx) =>
    [
      tx.reference,
      tx.user?.fullname ?? "",
      tx.user?.email ?? "",
      transactionTypeLabels[tx.transaction_type] ?? tx.transaction_type,
      tx.provider ?? "",
      String(tx.amount),
      String(tx.service_fee),
      transactionStatusLabels[tx.status],
      tx.recipient,
      tx.created_at,
    ]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<FilterValue<TransactionType>>("All");
  const [statusFilter, setStatusFilter] =
    useState<FilterValue<TransactionStatus>>("All");
<<<<<<< HEAD
  const [dateFilter, setDateFilter] = useState<DateFilter>("All time");
  const [providerFilter, setProviderFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailTransaction, setDetailTransaction] =
    useState<Transaction | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [statusModal, setStatusModal] = useState<Transaction | null>(null);
  const [statusValue, setStatusValue] = useState<TransactionStatus>("pending");
  const [statusNote, setStatusNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [refundModal, setRefundModal] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [savingRefund, setSavingRefund] = useState(false);
=======
  const [dateFilter, setDateFilter] = useState("Last 30 Days");
  const [providerFilter, setProviderFilter] =
    useState<FilterValue<Provider>>("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [detailTransaction, setDetailTransaction] =
    useState<Transaction | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(
    null,
  );
  const [processing, setProcessing] = useState(false);
  const [reverseReason, setReverseReason] = useState("");
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const load = () => transactionService.getAll().then(setTransactions);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setRefreshing(true);
    load().finally(() => setRefreshing(false));
  };

  const providers = useMemo(
    () =>
      Array.from(
        new Set(transactions.map((t) => t.provider).filter(Boolean)),
      ) as string[],
    [transactions],
  );

  const hasActiveFilters =
    search !== "" ||
    typeFilter !== "All" ||
    statusFilter !== "All" ||
    dateFilter !== "All time" ||
    providerFilter !== "All";

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("All");
    setStatusFilter("All");
    setDateFilter("All time");
    setProviderFilter("All");
    setPage(1);
  };

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.toLowerCase().replace(/\s/g, "");

    return transactions.filter((tx) => {
      const searchTarget = [
        tx.reference,
        tx.recipient,
        tx.user?.fullname,
        tx.user?.email,
        tx.account_or_phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .replace(/\s/g, "");
      const matchesSearch =
        !normalizedSearch || searchTarget.includes(normalizedSearch);
      const matchesType =
        typeFilter === "All" || tx.transaction_type === typeFilter;
      const matchesStatus = statusFilter === "All" || tx.status === statusFilter;
      const matchesProvider =
        providerFilter === "All" || tx.provider === providerFilter;
      const age = daysAgo(tx.created_at);
      const matchesDate =
        dateFilter === "All time" ||
        (dateFilter === "Today" && age === 0) ||
        (dateFilter === "Last 7 days" && age <= 7) ||
        (dateFilter === "Last 30 days" && age <= 30);

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesProvider &&
        matchesDate
      );
    });
  }, [dateFilter, providerFilter, search, statusFilter, transactions, typeFilter]);

  const stats = useMemo(
    () => ({
      total: transactions.length,
      successful: transactions.filter((t) => t.status === "success").length,
      pending: transactions.filter((t) => t.status === "pending").length,
      failed: transactions.filter((t) => t.status === "fail").length,
      refunded: transactions.filter((t) => t.refunded_at).length,
    }),
    [transactions],
  );

<<<<<<< HEAD
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const showingStart =
    filteredTransactions.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(currentPage * PAGE_SIZE, filteredTransactions.length);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
=======
  const {
    currentPage,
    pageItems: paginatedTransactions,
    pageSize,
    setPage,
    totalItems,
    totalPages,
  } = usePagination(filteredTransactions);
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571

  const pageIds = paginatedTransactions.map((t) => t.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleRow = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleExport = () => {
    const rows =
      selected.size > 0
        ? transactions.filter((t) => selected.has(t.id))
        : filteredTransactions;
    exportCsv(rows);
  };

  const applyUpdate = (updated: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t)),
    );
    setDetailTransaction((prev) =>
      prev && prev.id === updated.id ? updated : prev,
    );
  };

  const openStatusModal = (tx: Transaction) => {
    setStatusModal(tx);
    setStatusValue(tx.status);
    setStatusNote("");
    setOpenMenuId(null);
  };

<<<<<<< HEAD
  const submitStatusChange = async () => {
    if (!statusModal) return;
    setSavingStatus(true);
    try {
      const updated = await transactionService.updateStatus(
        statusModal.id,
        statusValue,
        statusNote.trim() || undefined,
=======
  const confirmAction = async () => {
    if (!confirmTarget) return;

    const { action, transaction } = confirmTarget;

    if (action === "reverse" && !reverseReason.trim()) {
      showToast("Enter a reason before reversing this transaction.", "error");
      return;
    }

    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (action === "retry") {
      const nextStatus = transaction.status === "Failed" ? "Pending" : "Successful";
      updateTransactionStatus(
        transaction.id,
        nextStatus,
        nextStatus === "Successful"
          ? "Retry completed successfully in local mock state."
          : "Retry submitted. Transaction is pending provider callback.",
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571
      );
      applyUpdate(updated);
      showToast(`${updated.reference} marked as ${transactionStatusLabels[updated.status]}.`);
      setStatusModal(null);
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    } finally {
      setSavingStatus(false);
    }
<<<<<<< HEAD
  };

  const openRefundModal = (tx: Transaction) => {
    setRefundModal(tx);
    setRefundReason("");
    setOpenMenuId(null);
  };

  const submitRefund = async () => {
    if (!refundModal) return;
    if (!refundReason.trim()) {
      showToast("Enter a reason before refunding this transaction.", "error");
      return;
    }
    setSavingRefund(true);
    try {
      const updated = await transactionService.refund(
        refundModal.id,
        refundReason.trim(),
      );
      applyUpdate(updated);
      showToast(`${updated.reference} refunded — wallet credited ${fmt(updated.amount)}.`);
      setRefundModal(null);
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    } finally {
      setSavingRefund(false);
    }
  };
=======

    if (action === "reverse") {
      updateTransactionStatus(
        transaction.id,
        "Reversed",
        `Refund approved locally. Reason: ${reverseReason.trim()}`,
      );
      showToast(`Refund processed for ${transaction.id}.`);
    }

    if (action === "mark-success") {
      updateTransactionStatus(
        transaction.id,
        "Successful",
        "Operator marked this transaction as successful in local mock state.",
      );
      showToast(`${transaction.id} marked as successful.`);
    }

    setProcessing(false);
    setConfirmTarget(null);
    setReverseReason("");
  };

  const renderActionMenu = (transaction: Transaction) => (
    <div className="relative flex justify-center">
      <button
        type="button"
        onClick={() =>
          setOpenMenuId(openMenuId === transaction.id ? null : transaction.id)
        }
        className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-600"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {openMenuId === transaction.id ? (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpenMenuId(null)}
          />
          <div className="absolute right-0 top-8 z-20 w-52 rounded-xl border border-slate-200/70 bg-white py-1 shadow-md">
            <button
              type="button"
              onClick={() => {
                setDetailTransaction(transaction);
                setOpenMenuId(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
            >
              <Eye className="h-3.5 w-3.5" /> View Details
            </button>
            <button
              type="button"
              onClick={() => openConfirm("retry", transaction)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retry Transaction
            </button>
            <button
              type="button"
              onClick={() => openConfirm("reverse", transaction)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
            >
              <Undo2 className="h-3.5 w-3.5" /> Reverse / Refund
            </button>
            <button
              type="button"
              onClick={() => openConfirm("mark-success", transaction)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Mark as Successful
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenMenuId(null);
                showToast(`Receipt for ${transaction.id} is ready.`);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
            >
              <ReceiptText className="h-3.5 w-3.5" /> Download Receipt
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        description="View all platform transactions"
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={filteredTransactions.length === 0}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              {selected.size > 0 ? `Export (${selected.size})` : "Export"}
            </Button>
            <Button
              variant="secondary"
              loading={refreshing}
              onClick={refresh}
              className="w-full sm:w-auto"
            >
              {refreshing ? null : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {loading ? (
<<<<<<< HEAD
          Array.from({ length: 5 }, (_, index) => (
            <Card key={index} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <SkeletonLine className="h-3 w-28" />
                <SkeletonLine className="h-8 w-8 rounded-lg" />
              </div>
              <SkeletonLine className="h-6 w-20" />
              <SkeletonLine className="mt-2 h-3 w-32" />
            </Card>
          ))
=======
          <SkeletonStatGrid count={4} className="contents" />
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571
        ) : (
          <>
            <StatCard
              label="Total Transactions"
              value={stats.total.toLocaleString("en-NG")}
              meta="All records"
              icon={Wallet2}
            />
            <StatCard
              label="Successful Transactions"
              value={stats.successful.toLocaleString("en-NG")}
              meta="Completed and fulfilled"
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard
              label="Pending Transactions"
              value={stats.pending.toLocaleString("en-NG")}
              meta="Awaiting provider callback"
              icon={Clock3}
              tone="warning"
            />
            <StatCard
              label="Failed Transactions"
              value={stats.failed.toLocaleString("en-NG")}
              meta="Needs operator attention"
              icon={XCircle}
              tone="danger"
            />
            <StatCard
              label="Refunded Transactions"
              value={stats.refunded.toLocaleString("en-NG")}
              meta="Wallet credited back"
              icon={Undo2}
            />
          </>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(240px,1fr)_repeat(5,minmax(132px,auto))]">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search reference, customer, email, or phone"
                className={`${inputCls} h-10 pl-9 text-xs`}
              />
            </div>
            <SelectFilter
              label="Type"
              value={typeFilter}
              options={["All", ...Object.keys(transactionTypeLabels)]}
              labels={transactionTypeLabels}
              onChange={(value) => {
                setTypeFilter(value as FilterValue<TransactionType>);
                setPage(1);
              }}
            />
            <SelectFilter
              label="Status"
              value={statusFilter}
              options={["All", ...Object.keys(transactionStatusLabels)]}
              labels={transactionStatusLabels}
              onChange={(value) => {
                setStatusFilter(value as FilterValue<TransactionStatus>);
                setPage(1);
              }}
            />
            <select
              aria-label="Date range"
              value={dateFilter}
              onChange={(event) => {
                setDateFilter(event.target.value as DateFilter);
                setPage(1);
              }}
              className={`${selectCls} h-10 py-2 text-xs lg:w-40`}
            >
              {(["All time", "Today", "Last 7 days", "Last 30 days"] as const).map(
                (option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ),
              )}
            </select>
            <SelectFilter
              label="Provider"
              value={providerFilter}
              options={["All", ...providers]}
              onChange={(value) => {
                setProviderFilter(value);
                setPage(1);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!hasActiveFilters}
              onClick={resetFilters}
              className="h-10"
            >
              Reset filters
            </Button>
          </div>
        </div>

        {selected.size > 0 ? (
          <div className="flex items-center justify-between gap-3 border-b border-indigo-100 bg-indigo-50 px-4 py-2">
            <p className="text-xs font-medium text-indigo-700">
              {selected.size} transaction{selected.size === 1 ? "" : "s"}{" "}
              selected
            </p>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Clear selection
            </button>
          </div>
        ) : null}

        {loading ? (
          <SkeletonRows count={8} />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No transactions found"
            description="Try adjusting your search, status, provider, or date filters."
            action={
              hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
<<<<<<< HEAD
            <div className="overflow-x-auto">
              <table className="w-full table-fixed min-w-[560px] lg:min-w-0 text-sm">
=======
            <div className="divide-y divide-slate-100 sm:hidden">
              {paginatedTransactions.map((transaction) => (
                <div key={transaction.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-medium text-indigo-700">
                      {initials(transaction.customerName)}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailTransaction(transaction)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {transaction.customerName}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {transaction.email}
                          </p>
                        </div>
                        <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-slate-900">
                          {fmt(transaction.amount)}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <TransactionStatusBadge status={transaction.status} />
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                          {transaction.type}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                          {transaction.provider}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span className="font-mono">{transaction.id}</span>
                        <span>{transaction.paymentMethod}</span>
                        <span>{dateLabel(transaction.dateTime)}</span>
                      </div>
                    </button>
                    <div className="shrink-0">{renderActionMenu(transaction)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full table-fixed min-w-[520px] lg:min-w-0 text-sm">
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="w-10 px-4 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={togglePage}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label="Select all on page"
                      />
                    </th>
                    <th className="hidden lg:table-cell lg:w-[11%] whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500">Reference</th>
                    <th className="w-[42%] lg:w-[20%] whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500">Customer</th>
                    <th className="hidden lg:table-cell lg:w-[9%] whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500">Type</th>
                    <th className="hidden lg:table-cell lg:w-[10%] whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500">Provider</th>
                    <th className="w-[20%] lg:w-[11%] whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-500">Amount</th>
                    <th className="w-[22%] lg:w-[12%] whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                    <th className="hidden lg:table-cell lg:w-[12%] whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500">Recipient</th>
                    <th className="hidden lg:table-cell lg:w-[9%] whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-500">Date</th>
                    <th className="w-10 whitespace-nowrap px-2 py-2 text-center text-xs font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className={`transition-colors hover:bg-gray-50 ${selected.has(tx.id) ? "bg-indigo-50/40" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(tx.id)}
                          onChange={() => toggleRow(tx.id)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          aria-label={`Select ${tx.reference}`}
                        />
                      </td>
                      <td className="hidden lg:table-cell min-w-0 px-2 py-3 font-mono text-xs text-slate-500">
                        <span className="block truncate" title={tx.reference}>
                          {tx.reference}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-slate-900">
                            {tx.user?.fullname ?? "—"}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {tx.user?.email ?? tx.recipient}
                          </p>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell whitespace-nowrap px-2 py-3 text-xs text-slate-600">
                        {transactionTypeLabels[tx.transaction_type] ??
                          tx.transaction_type}
                      </td>
                      <td className="hidden lg:table-cell whitespace-nowrap px-2 py-3 text-xs text-slate-500 capitalize">
                        {tx.provider ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-right text-xs font-semibold tabular-nums text-slate-900">
                        {fmt(tx.amount)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <TransactionStatusBadge status={tx.status} />
                          {tx.refunded_at ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700"
                              title={tx.refund_reason ?? undefined}
                            >
                              <Undo2 className="h-2.5 w-2.5" /> Refunded
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell whitespace-nowrap px-2 py-3 text-xs text-slate-500">
                        {tx.recipient}
                      </td>
                      <td className="hidden lg:table-cell whitespace-nowrap px-2 py-3 text-xs text-slate-400">
                        {dateLabel(tx.created_at)}
                      </td>
                      <td className="px-2 py-3">
<<<<<<< HEAD
                        <div className="relative flex justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(openMenuId === tx.id ? null : tx.id)
                            }
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-600"
                            title="Actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openMenuId === tx.id ? (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 top-8 z-20 w-52 rounded-xl border border-slate-200/70 bg-white py-1 shadow-md">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDetailTransaction(tx);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                                >
                                  <Eye className="h-3.5 w-3.5" /> View details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openStatusModal(tx)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" /> Change
                                  status
                                </button>
                                {isRefundable(tx) ? (
                                  <button
                                    type="button"
                                    onClick={() => openRefundModal(tx)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 transition-colors hover:bg-red-50"
                                  >
                                    <Undo2 className="h-3.5 w-3.5" /> Refund
                                  </button>
                                ) : null}
                              </div>
                            </>
                          ) : null}
                        </div>
=======
                        {renderActionMenu(transaction)}
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

<<<<<<< HEAD
            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                Showing {showingStart}-{showingEnd} of{" "}
                {filteredTransactions.length} transactions
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 px-2 text-xs text-slate-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`h-8 min-w-8 rounded-md px-2 text-xs font-medium transition-colors ${
                      currentPage === pageNumber
                        ? "bg-indigo-600 text-white"
                        : "text-slate-500 hover:bg-gray-100"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-200 px-2 text-xs text-slate-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
=======
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              label="transactions"
            />
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571
          </>
        )}
      </Card>

      {detailTransaction ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div
            className="hidden flex-1 sm:block"
            onClick={() => setDetailTransaction(null)}
          />
          <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl border-l border-slate-200/70">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  Transaction details
                </p>
<<<<<<< HEAD
                <p
                  className="truncate font-mono text-xs text-slate-400"
                  title={detailTransaction.reference}
                >
                  {detailTransaction.reference}
=======
                <p className="break-all font-mono text-xs text-slate-400">
                  {detailTransaction.id}
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailTransaction(null)}
                className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {fmt(detailTransaction.amount)}
                  </p>
                </div>
                <TransactionStatusBadge status={detailTransaction.status} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["Customer name", detailTransaction.user?.fullname ?? "—"],
                    ["Email", detailTransaction.user?.email ?? "—"],
                    ["Recipient", detailTransaction.recipient],
                    [
                      "Service type",
                      transactionTypeLabels[detailTransaction.transaction_type] ??
                        detailTransaction.transaction_type,
                    ],
                    ["Provider", detailTransaction.provider ?? "—"],
                    ["Fee / commission", fmt(detailTransaction.service_fee)],
                    ["Discount", fmt(detailTransaction.discount_amount)],
                    [
                      "Funding method",
                      detailTransaction.funding_method ?? "—",
                    ],
                    ["Reference", detailTransaction.reference],
                    ["Payment reference", detailTransaction.payment_reference ?? "—"],
                    ["Date / time", dateLabel(detailTransaction.created_at)],
                    ["Completed at", dateLabel(detailTransaction.completed_at)],
                    ["Balance before", fmt(detailTransaction.balance_before)],
                    ["Balance after", fmt(detailTransaction.balance_after)],
                    ["Token / PIN", detailTransaction.token ?? "—"],
                    ["Platform", detailTransaction.platform ?? "—"],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-gray-200 bg-white px-3.5 py-3"
                  >
                    <p className="text-xs font-medium text-slate-400">
                      {label}
                    </p>
<<<<<<< HEAD
                    <p className="mt-1 text-sm text-slate-800 break-words">
                      {value}
                    </p>
=======
                    <p className="mt-1 break-words text-sm text-slate-800">{value}</p>
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571
                  </div>
                ))}
              </div>

<<<<<<< HEAD
              {detailTransaction.refunded_at ? (
                <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-3.5 py-3">
                  <p className="text-xs font-medium text-sky-700">
                    Refunded {dateLabel(detailTransaction.refunded_at)}
                  </p>
                  <p className="mt-1 text-sm text-sky-900">
                    {detailTransaction.refund_reason}
                  </p>
=======
              <div className="mt-4 rounded-lg border border-gray-200 bg-white px-3.5 py-3">
                <p className="text-xs font-medium text-slate-400">
                  API response / message
                </p>
                <p className="mt-1 break-words text-sm text-slate-700">
                  {detailTransaction.apiMessage}
                </p>
              </div>

              <div className="mt-5">
                <p className="mb-3 text-sm font-semibold text-slate-900">
                  Timeline
                </p>
                <div className="space-y-3">
                  {detailTransaction.timeline.map((item, index) => (
                    <div key={`${item.time}-${item.title}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                        {index !== detailTransaction.timeline.length - 1 ? (
                          <span className="mt-1 h-full min-h-10 w-px bg-gray-200" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1 pb-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-400">{item.time}</p>
                        </div>
                        <p className="mt-1 break-words text-xs text-slate-500">
                          {item.note}
                        </p>
                      </div>
                    </div>
                  ))}
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571
                </div>
              ) : null}

              {detailTransaction.response_message ? (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white px-3.5 py-3">
                  <p className="text-xs font-medium text-slate-400">
                    API response / message
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {detailTransaction.response_message}
                  </p>
                </div>
              ) : null}

              <div className="mt-4 flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => openStatusModal(detailTransaction)}
                >
                  <RotateCcw className="h-4 w-4" /> Change status
                </Button>
                {isRefundable(detailTransaction) ? (
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={() => openRefundModal(detailTransaction)}
                  >
                    <Undo2 className="h-4 w-4" /> Refund
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {statusModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white shadow-xl">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                Change transaction status
              </p>
<<<<<<< HEAD
              <p className="mt-1 font-mono text-xs text-slate-400">
                {statusModal.reference}
              </p>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Status
                </label>
                <select
                  value={statusValue}
                  onChange={(event) =>
                    setStatusValue(event.target.value as TransactionStatus)
                  }
                  className={inputCls}
                >
                  {Object.entries(transactionStatusLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Note (optional)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  className={`${inputCls} min-h-20 resize-none`}
                  placeholder="Reason for this status change, for the audit trail"
                />
              </div>
              <div className="mb-4 flex gap-2.5 rounded-lg border border-amber-100 bg-amber-50 px-3.5 py-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800">
                  This only relabels the transaction — it does not move any
                  money. Use Refund to actually credit the wallet back.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setStatusModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  loading={savingStatus}
                  disabled={savingStatus}
                  onClick={() => void submitStatusChange()}
                >
                  Save status
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {refundModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white shadow-xl">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                Refund transaction?
              </p>
              <p className="mt-1 font-mono text-xs text-slate-400">
                {refundModal.reference}
=======
              <p className="mt-1 break-all font-mono text-xs text-slate-400">
                {confirmTarget.transaction.id}
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571
              </p>
            </div>
            <div className="p-4">
              <div className="mb-4 flex gap-2.5 rounded-lg border border-amber-100 bg-amber-50 px-3.5 py-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800">
                  This credits {fmt(refundModal.amount)} back to{" "}
                  {refundModal.user?.fullname ?? "the customer"}'s wallet
                  immediately and marks this transaction as failed/refunded.
                  This cannot be undone from here.
                </p>
              </div>
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                <div className="flex flex-wrap justify-between gap-3">
                  <span className="text-slate-500">Customer</span>
<<<<<<< HEAD
                  <span className="font-medium text-slate-900">
                    {refundModal.user?.fullname ?? "—"}
=======
                  <span className="break-words text-right font-medium text-slate-900">
                    {confirmTarget.transaction.customerName}
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-3">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-medium text-slate-900">
                    {fmt(refundModal.amount)}
                  </span>
                </div>
              </div>
<<<<<<< HEAD
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Reason for refund
                </label>
                <textarea
                  value={refundReason}
                  onChange={(event) => setRefundReason(event.target.value)}
                  className={`${inputCls} min-h-24 resize-none`}
                  placeholder="Example: Customer debited but value was not delivered"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setRefundModal(null)}
=======
              {confirmTarget.action === "reverse" ? (
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Reason for reversal
                  </label>
                  <textarea
                    value={reverseReason}
                    onChange={(event) => setReverseReason(event.target.value)}
                    className={`${inputCls} min-h-24 resize-none`}
                    placeholder="Example: Customer debited but value was not delivered"
                  />
                </div>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={processing}
                  onClick={() => setConfirmTarget(null)}
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  fullWidth
<<<<<<< HEAD
                  loading={savingRefund}
                  disabled={savingRefund || !refundReason.trim()}
                  onClick={() => void submitRefund()}
                >
                  Confirm refund
=======
                  loading={processing}
                  disabled={processing}
                  onClick={confirmAction}
                >
                  {processing ? "" : "Confirm"}
>>>>>>> d14c8971c4fc0d17754e7a9a2ea3b7aeec337571
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed left-4 right-4 top-16 z-[70] space-y-2 sm:left-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex w-full items-center gap-2 rounded-lg border px-3.5 py-3 text-sm shadow-lg sm:min-w-72 ${
              toast.tone === "success"
                ? "border-emerald-100 bg-white text-emerald-700"
                : "border-red-100 bg-white text-red-700"
            }`}
          >
            {toast.tone === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {refreshing ? (
        <div className="pointer-events-none fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-lg">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Refreshing transactions
        </div>
      ) : null}
    </div>
  );
}
