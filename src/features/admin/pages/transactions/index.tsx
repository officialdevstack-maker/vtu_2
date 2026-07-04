import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  Inbox,
  Loader2,
  MoreVertical,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Undo2,
  Wallet2,
  X,
  XCircle,
} from "lucide-react";
import { fmt } from "../../../user/data/mock";
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  SkeletonLine,
  StatCard,
  inputCls,
} from "../../../user/components/shared-ui";

type TransactionType =
  | "Airtime"
  | "Data"
  | "Cable"
  | "Electricity"
  | "Exam PIN"
  | "Wallet Funding";
type TransactionStatus = "Successful" | "Pending" | "Failed" | "Reversed";
type Provider =
  | "MTN"
  | "Airtel"
  | "Glo"
  | "9mobile"
  | "DSTV"
  | "GOTV"
  | "PHCN";
type PaymentMethod =
  | "Wallet"
  | "Bank Transfer"
  | "Card"
  | "Paystack"
  | "Monnify";
type FilterValue<T extends string> = "All" | T;

type Transaction = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  type: TransactionType;
  provider: Provider;
  amount: number;
  fee: number;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  reference: string;
  dateTime: string;
  narration: string;
  apiMessage: string;
  timeline: Array<{ time: string; title: string; note: string }>;
};

// Shape actually returned by the API for a transaction — see
// app/Http/Resources/TransactionResource.php and API_DOCUMENTATION.md
// (section 12, Universal Table API, against the `transactions` table).
// This is narrower than the UI-facing `Transaction` type below, which
// carries extra display-only fields not present on the backend model.
export interface ApiTransaction {
  id: number;
  user_id: string;
  amount: number;
  status: "pending" | "success" | "fail";
  transaction_type:
    | "airtime_recharge"
    | "data_subscription"
    | "cable_subscription"
    | "electric_bill"
    | "exam"
    | "betting_funding"
    | "airtime_pin"
    | "data_pin"
    | "wallet_funding"
    | "manual_funding"
    | "bulksms";
  reference: string;
  promotion_id: number | null;
  provider: string | null;
  recipient: string;
  created_at: string;
  updated_at: string;
}

type ConfirmAction = "retry" | "reverse" | "mark-success";
type ConfirmTarget = { action: ConfirmAction; transaction: Transaction };
type Toast = { id: number; tone: "success" | "error"; message: string };

const PAGE_SIZE = 10;
const baseDate = new Date("2026-07-04T15:30:00+01:00");

const transactionTypes: TransactionType[] = [
  "Airtime",
  "Data",
  "Cable",
  "Electricity",
  "Exam PIN",
  "Wallet Funding",
];
const statuses: TransactionStatus[] = [
  "Successful",
  "Pending",
  "Failed",
  "Reversed",
];
const providers: Provider[] = [
  "MTN",
  "Airtel",
  "Glo",
  "9mobile",
  "DSTV",
  "GOTV",
  "PHCN",
];
const paymentMethods: PaymentMethod[] = [
  "Wallet",
  "Bank Transfer",
  "Card",
  "Paystack",
  "Monnify",
];

const customers = [
  ["Chukwuemeka Obi", "emeka.obi@gmail.com", "+234 803 210 4471"],
  ["Adaeze Nwosu", "adaeze.nwosu@outlook.com", "+234 706 552 8890"],
  ["Kunle Adeleke", "kunle.adeleke@gmail.com", "+234 812 447 6631"],
  ["Fatima Bello", "fatima.bello@yahoo.com", "+234 905 331 2204"],
  ["Tunde Bakare", "tunde.bakare@gmail.com", "+234 701 998 3312"],
  ["Ngozi Eze", "ngozi.eze@gmail.com", "+234 814 665 0092"],
  ["Ibrahim Musa", "ibrahim.musa@hotmail.com", "+234 809 221 7743"],
  ["Chidinma Okafor", "chidinma.okafor@gmail.com", "+234 703 118 9954"],
  ["Segun Owolabi", "segun.owolabi@gmail.com", "+234 810 774 3321"],
  ["Blessing Udo", "blessing.udo@gmail.com", "+234 802 556 1187"],
  ["Halima Sani", "halima.sani@gmail.com", "+234 708 330 6621"],
  ["Yusuf Abdullahi", "yusuf.abdullahi@gmail.com", "+234 816 442 9903"],
];

const amountByType: Record<TransactionType, number[]> = {
  Airtime: [500, 1000, 2000, 5000],
  Data: [1200, 1500, 2500, 3500, 6000],
  Cable: [3600, 6200, 9800, 15700, 24500],
  Electricity: [3000, 5000, 10000, 15000, 25000],
  "Exam PIN": [4500, 6200, 8500, 12000],
  "Wallet Funding": [10000, 20000, 50000, 75000, 120000],
};

const providerByType: Record<TransactionType, Provider[]> = {
  Airtime: ["MTN", "Airtel", "Glo", "9mobile"],
  Data: ["MTN", "Airtel", "Glo", "9mobile"],
  Cable: ["DSTV", "GOTV"],
  Electricity: ["PHCN"],
  "Exam PIN": ["PHCN"],
  "Wallet Funding": ["MTN", "Airtel", "Glo", "9mobile"],
};

const statusTone: Record<TransactionStatus, string> = {
  Successful: "bg-emerald-50 text-emerald-700",
  Pending: "bg-amber-50 text-amber-700",
  Failed: "bg-red-50 text-red-700",
  Reversed: "bg-sky-50 text-sky-700",
};

const statusDot: Record<TransactionStatus, string> = {
  Successful: "bg-emerald-500",
  Pending: "bg-amber-500",
  Failed: "bg-red-500",
  Reversed: "bg-sky-500",
};

const dateLabel = (value: string) =>
  new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const daysAgo = (value: string) => {
  const diff = baseDate.getTime() - new Date(value).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const makeMockTransactions = (): Transaction[] =>
  Array.from({ length: 87 }, (_, index) => {
    const type = transactionTypes[index % transactionTypes.length];
    const [customerName, email, phone] = customers[index % customers.length];
    const providerOptions = providerByType[type];
    const provider = providerOptions[index % providerOptions.length];
    const amountOptions = amountByType[type];
    const amount = amountOptions[index % amountOptions.length];
    const status = statuses[[0, 0, 0, 1, 2, 0, 3, 0][index % 8]];
    const date = new Date(baseDate);
    date.setHours(date.getHours() - index * 7);
    const ref = `REF-26${String(index + 1482).padStart(5, "0")}`;
    const id = `TXN-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(index + 1).padStart(4, "0")}`;
    const serviceTarget =
      type === "Cable"
        ? "Smartcard 7034529811"
        : type === "Electricity"
          ? "Meter 04192388765"
          : type === "Exam PIN"
            ? "WAEC result checker PIN"
            : type === "Wallet Funding"
              ? "Wallet top-up"
              : phone.replace("+234 ", "0").replace(/\s/g, "");

    return {
      id,
      customerName,
      email,
      phone,
      type,
      provider,
      amount,
      fee: Math.max(25, Math.round(amount * 0.012)),
      status,
      paymentMethod: paymentMethods[index % paymentMethods.length],
      reference: ref,
      dateTime: date.toISOString(),
      narration: `${provider} ${type} purchase for ${serviceTarget}`,
      apiMessage:
        status === "Successful"
          ? "Vendor accepted request and returned a successful fulfillment response."
          : status === "Pending"
            ? "Vendor request queued. Awaiting final delivery confirmation."
            : status === "Reversed"
              ? "Transaction reversed locally after failed fulfillment confirmation."
              : "Vendor returned an insufficient balance or timeout response.",
      timeline: [
        {
          time: dateLabel(date.toISOString()),
          title: "Transaction created",
          note: `${customerName} initiated ${type.toLowerCase()} via ${paymentMethods[index % paymentMethods.length]}.`,
        },
        {
          time: dateLabel(new Date(date.getTime() + 45000).toISOString()),
          title: "Provider request sent",
          note: `${provider} gateway received reference ${ref}.`,
        },
        {
          time: dateLabel(new Date(date.getTime() + 125000).toISOString()),
          title:
            status === "Successful"
              ? "Fulfillment completed"
              : status === "Failed"
                ? "Fulfillment failed"
                : status === "Reversed"
                  ? "Wallet reversal posted"
                  : "Awaiting provider callback",
          note:
            status === "Successful"
              ? "Customer value delivered and receipt generated."
              : status === "Failed"
                ? "No value delivered. Transaction requires operator review."
                : status === "Reversed"
                  ? "Customer wallet credited after reversal approval."
                  : "System will update once provider confirms final state.",
        },
      ],
    };
  });

const TransactionStatusBadge = ({ status }: { status: TransactionStatus }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${statusTone[status]}`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${statusDot[status]}`} />
    {status}
  </span>
);

const SelectFilter = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: FilterValue<T> | string;
  options: string[];
  onChange: (value: string) => void;
}) => (
  <select
    aria-label={label}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className={`${inputCls} h-10 py-2 text-xs sm:w-40`}
  >
    {options.map((option) => (
      <option key={option} value={option}>
        {option === "All" ? `All ${label.toLowerCase()}` : option}
      </option>
    ))}
  </select>
);

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    makeMockTransactions(),
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState<FilterValue<TransactionType>>("All");
  const [statusFilter, setStatusFilter] =
    useState<FilterValue<TransactionStatus>>("All");
  const [dateFilter, setDateFilter] = useState("Last 30 Days");
  const [providerFilter, setProviderFilter] =
    useState<FilterValue<Provider>>("All");
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [detailTransaction, setDetailTransaction] =
    useState<Transaction | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(
    null,
  );
  const [reverseReason, setReverseReason] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const hasActiveFilters =
    search !== "" ||
    typeFilter !== "All" ||
    statusFilter !== "All" ||
    dateFilter !== "Last 30 Days" ||
    providerFilter !== "All";

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.toLowerCase().replace(/\s/g, "");

    return transactions.filter((transaction) => {
      const searchTarget = [
        transaction.id,
        transaction.reference,
        transaction.customerName,
        transaction.email,
        transaction.phone,
      ]
        .join(" ")
        .toLowerCase()
        .replace(/\s/g, "");
      const matchesSearch =
        !normalizedSearch || searchTarget.includes(normalizedSearch);
      const matchesType =
        typeFilter === "All" || transaction.type === typeFilter;
      const matchesStatus =
        statusFilter === "All" || transaction.status === statusFilter;
      const matchesProvider =
        providerFilter === "All" || transaction.provider === providerFilter;
      const transactionAge = daysAgo(transaction.dateTime);
      const matchesDate =
        dateFilter === "Custom" ||
        (dateFilter === "Today" && transactionAge === 0) ||
        (dateFilter === "Last 7 Days" && transactionAge <= 7) ||
        (dateFilter === "Last 30 Days" && transactionAge <= 30);

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesProvider &&
        matchesDate
      );
    });
  }, [
    dateFilter,
    providerFilter,
    search,
    statusFilter,
    transactions,
    typeFilter,
  ]);

  const stats = useMemo(
    () => ({
      total: transactions.length,
      successful: transactions.filter((tx) => tx.status === "Successful")
        .length,
      pending: transactions.filter((tx) => tx.status === "Pending").length,
      failed: transactions.filter((tx) => tx.status === "Failed").length,
    }),
    [transactions],
  );

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const showingStart =
    filteredTransactions.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingEnd = Math.min(currentPage * PAGE_SIZE, filteredTransactions.length);

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("All");
    setStatusFilter("All");
    setDateFilter("Last 30 Days");
    setProviderFilter("All");
    setPage(1);
  };

  const refreshTransactions = () => {
    setRefreshing(true);
    setLoading(true);
    window.setTimeout(() => {
      setTransactions(makeMockTransactions());
      resetFilters();
      setLoading(false);
      setRefreshing(false);
      showToast("Transactions refreshed from mock data.");
    }, 650);
  };

  const updateTransactionStatus = (
    transactionId: string,
    status: TransactionStatus,
    apiMessage: string,
  ) => {
    const now = new Date(baseDate).toISOString();
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === transactionId
          ? {
              ...transaction,
              status,
              apiMessage,
              timeline: [
                ...transaction.timeline,
                {
                  time: dateLabel(now),
                  title: `${status} by admin`,
                  note: apiMessage,
                },
              ],
            }
          : transaction,
      ),
    );
  };

  const openConfirm = (action: ConfirmAction, transaction: Transaction) => {
    setConfirmTarget({ action, transaction });
    setReverseReason("");
    setOpenMenuId(null);
  };

  const confirmAction = () => {
    if (!confirmTarget) return;

    const { action, transaction } = confirmTarget;

    if (action === "retry") {
      const nextStatus = transaction.status === "Failed" ? "Pending" : "Successful";
      updateTransactionStatus(
        transaction.id,
        nextStatus,
        nextStatus === "Successful"
          ? "Retry completed successfully in local mock state."
          : "Retry submitted. Transaction is pending provider callback.",
      );
      showToast(`Retry submitted for ${transaction.id}.`);
    }

    if (action === "reverse") {
      if (!reverseReason.trim()) {
        showToast("Enter a reason before reversing this transaction.", "error");
        return;
      }
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

    setConfirmTarget(null);
    setReverseReason("");
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        description="View and manage all platform transactions"
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => showToast("Transactions export queued.")}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button
              variant="secondary"
              loading={refreshing}
              onClick={refreshTransactions}
              className="w-full sm:w-auto"
            >
              {refreshing ? null : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }, (_, index) => (
            <Card key={index} className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <SkeletonLine className="h-3 w-28" />
                <SkeletonLine className="h-8 w-8 rounded-lg" />
              </div>
              <SkeletonLine className="h-6 w-20" />
              <SkeletonLine className="mt-2 h-3 w-32" />
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Total Transactions"
              value={stats.total.toLocaleString("en-NG")}
              meta="All mock records"
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
                placeholder="Search ID, customer, email, or phone"
                className={`${inputCls} h-10 pl-9 text-xs`}
              />
            </div>
            <SelectFilter
              label="Type"
              value={typeFilter}
              options={["All", ...transactionTypes]}
              onChange={(value) =>
                {
                  setTypeFilter(value as FilterValue<TransactionType>);
                  setPage(1);
                }
              }
            />
            <SelectFilter
              label="Status"
              value={statusFilter}
              options={["All", ...statuses]}
              onChange={(value) =>
                {
                  setStatusFilter(value as FilterValue<TransactionStatus>);
                  setPage(1);
                }
              }
            />
            <select
              aria-label="Date range"
              value={dateFilter}
              onChange={(event) => {
                setDateFilter(event.target.value);
                setPage(1);
              }}
              className={`${inputCls} h-10 py-2 text-xs sm:w-40`}
            >
              {["Today", "Last 7 Days", "Last 30 Days", "Custom"].map(
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
                setProviderFilter(value as FilterValue<Provider>);
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

        {loading ? (
          <div className="p-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="flex items-center gap-4 py-3">
                <SkeletonLine className="h-8 w-8 rounded-full" />
                <SkeletonLine className="h-3 flex-1" />
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="h-7 w-7 rounded-md" />
              </div>
            ))}
          </div>
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      "Transaction ID",
                      "Customer",
                      "Type",
                      "Provider",
                      "Amount",
                      "Status",
                      "Payment Method",
                      "Date",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className={`whitespace-nowrap px-4 py-2 text-xs font-medium text-slate-500 ${
                          heading === "Amount"
                            ? "text-right"
                            : heading === "Actions"
                              ? "text-center"
                              : "text-left"
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                        {transaction.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-medium text-indigo-700">
                            {initials(transaction.customerName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-slate-900">
                              {transaction.customerName}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {transaction.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                        {transaction.type}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {transaction.provider}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold tabular-nums text-slate-900">
                        {fmt(transaction.amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <TransactionStatusBadge status={transaction.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {transaction.paymentMethod}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                        {dateLabel(transaction.dateTime)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative flex justify-center">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === transaction.id
                                  ? null
                                  : transaction.id,
                              )
                            }
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-600"
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
                              <div className="absolute right-0 top-8 z-20 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
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
                                  <RotateCcw className="h-3.5 w-3.5" /> Retry
                                  Transaction
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openConfirm("reverse", transaction)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                                >
                                  <Undo2 className="h-3.5 w-3.5" /> Reverse /
                                  Refund
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openConfirm("mark-success", transaction)
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                                >
                                  <ShieldCheck className="h-3.5 w-3.5" /> Mark
                                  as Successful
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    showToast(
                                      `Receipt for ${transaction.id} is ready.`,
                                    );
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-gray-50"
                                >
                                  <ReceiptText className="h-3.5 w-3.5" />{" "}
                                  Download Receipt
                                </button>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                Showing {showingStart}-{showingEnd} of{" "}
                {filteredTransactions.length} transactions
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
            </div>
          </>
        )}
      </Card>

      {detailTransaction ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div
            className="hidden flex-1 sm:block"
            onClick={() => setDetailTransaction(null)}
          />
          <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Transaction details
                </p>
                <p className="font-mono text-xs text-slate-400">
                  {detailTransaction.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailTransaction(null)}
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-gray-100"
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
                {[
                  ["Customer name", detailTransaction.customerName],
                  ["Email", detailTransaction.email],
                  ["Phone", detailTransaction.phone],
                  ["Service type", detailTransaction.type],
                  ["Provider", detailTransaction.provider],
                  ["Fee / commission", fmt(detailTransaction.fee)],
                  ["Payment method", detailTransaction.paymentMethod],
                  ["Reference number", detailTransaction.reference],
                  ["Date / time", dateLabel(detailTransaction.dateTime)],
                  ["Narration", detailTransaction.narration],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-gray-200 bg-white px-3.5 py-3"
                  >
                    <p className="text-xs font-medium text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-sm text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-gray-200 bg-white px-3.5 py-3">
                <p className="text-xs font-medium text-slate-400">
                  API response / message
                </p>
                <p className="mt-1 text-sm text-slate-700">
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
                      <div className="flex-1 pb-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-900">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-400">{item.time}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.note}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {confirmTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">
                {confirmTarget.action === "retry"
                  ? "Retry transaction?"
                  : confirmTarget.action === "reverse"
                    ? "Reverse / refund transaction?"
                    : "Mark transaction as successful?"}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-400">
                {confirmTarget.transaction.id}
              </p>
            </div>
            <div className="p-4">
              <div className="mb-4 flex gap-2.5 rounded-lg border border-amber-100 bg-amber-50 px-3.5 py-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800">
                  This is frontend-only. The change will update local mock state
                  on this page only.
                </p>
              </div>
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Customer</span>
                  <span className="font-medium text-slate-900">
                    {confirmTarget.transaction.customerName}
                  </span>
                </div>
                <div className="mt-2 flex justify-between gap-3">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-medium text-slate-900">
                    {fmt(confirmTarget.transaction.amount)}
                  </span>
                </div>
              </div>
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
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setConfirmTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant={
                    confirmTarget.action === "reverse" ? "danger" : "primary"
                  }
                  fullWidth
                  onClick={confirmAction}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed right-4 top-16 z-[70] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex min-w-72 items-center gap-2 rounded-lg border px-3.5 py-3 text-sm shadow-lg ${
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
          Refreshing mock transactions
        </div>
      ) : null}
    </div>
  );
}
