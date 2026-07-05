import { useMemo, useState } from "react";
import { Search, Download, X, Receipt, Printer } from "lucide-react";
import { fmt } from "../data/mock";
import {
  StatusBadge, PageHeader, Card, Button, EmptyState, Pagination, CopyButton, inputCls, selectCls,
} from "../components/shared-ui";
import { usePagination } from "../../../shared/pagination";
import { useAuth, type UserTransaction } from "../../../shared/providers/auth";
import { transactionTypeMeta, isCredit, toNumber, badgeStatus, dateLabel } from "../utils/transactionDisplay";

type Period = "today" | "yesterday" | "this_week" | "earlier";

const periodLabels: Record<Period, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This week",
  earlier: "Earlier",
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const periodOf = (createdAt: string, now: Date): Period => {
  const created = startOfDay(new Date(createdAt));
  const today = startOfDay(now);
  const diffDays = Math.round((today.getTime() - created.getTime()) / 86_400_000);
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays <= 7) return "this_week";
  return "earlier";
};

const csvEscape = (value: string) =>
  /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const printReceipt = (tx: UserTransaction) => {
  const meta = transactionTypeMeta[tx.transaction_type] ?? { label: tx.transaction_type };
  const credit = isCredit(tx);
  const amount = toNumber(tx.amount);

  const rows: [string, string][] = [
    ["Reference", tx.transaction_reference],
    ["Type", meta.label],
    ["Recipient", tx.receiver ?? tx.account_or_phone ?? "—"],
    ["Provider", tx.provider ?? "—"],
    ["Amount", `${credit ? "+" : "-"}${fmt(amount)}`],
  ];
  const fee = toNumber(tx.service_fee);
  if (fee > 0) rows.push(["Fee", fmt(fee)]);
  const discount = toNumber(tx.discount_amount);
  if (discount > 0) rows.push(["Discount", `- ${fmt(discount)}`]);
  rows.push(["Status", badgeStatus(tx.status)]);
  rows.push(["Date", dateLabel(tx.created_at)]);
  if (tx.token) rows.push(["PIN / Token", tx.token]);
  if (tx.refunded_at) rows.push(["Refunded", dateLabel(tx.refunded_at)]);

  const rowsHtml = rows
    .map(
      ([k, v]) =>
        `<tr><td class="label">${escapeHtml(k)}</td><td class="value">${escapeHtml(v)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Receipt ${escapeHtml(tx.transaction_reference)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Arial, sans-serif; padding: 32px; color: #0f172a; max-width: 420px; margin: 0 auto; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  p.sub { color: #64748b; font-size: 12px; margin: 0 0 20px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; vertical-align: top; }
  td.label { color: #64748b; white-space: nowrap; padding-right: 12px; }
  td.value { text-align: right; font-weight: 600; word-break: break-word; }
  .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>Payment receipt</h1>
  <p class="sub">${escapeHtml(tx.transaction_reference)}</p>
  <table>${rowsHtml}</table>
  <p class="footer">Generated ${escapeHtml(new Date().toLocaleString("en-NG"))}</p>
</body>
</html>`;

  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
};

const exportCsv = (rows: UserTransaction[]) => {
  const header = ["Reference", "Type", "Provider", "Amount", "Status", "Recipient", "Date"];
  const lines = rows.map((tx) =>
    [
      tx.transaction_reference,
      transactionTypeMeta[tx.transaction_type]?.label ?? tx.transaction_type,
      tx.provider ?? "",
      String(tx.amount),
      tx.status,
      tx.receiver ?? tx.account_or_phone ?? "",
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
  const { user, isInitializing } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [period, setPeriod] = useState<Period | "all">("all");
  const [selectedTx, setSelectedTx] = useState<UserTransaction | null>(null);

  const transactions = useMemo<UserTransaction[]>(
    () =>
      [...(user?.transactions ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [user?.transactions],
  );

  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter((tx) => {
      const label = transactionTypeMeta[tx.transaction_type]?.label ?? tx.transaction_type;
      const haystack = [tx.transaction_reference, tx.receiver, tx.account_or_phone, label]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        haystack.includes(q) &&
        (status === "all" || tx.status === status) &&
        (type === "all" || tx.transaction_type === type) &&
        (period === "all" || periodOf(tx.created_at, now) === period)
      );
    });
  }, [transactions, search, status, type, period, now]);

  const {
    currentPage,
    pageItems: paginatedTransactions,
    pageSize,
    setPage,
    totalItems,
    totalPages,
  } = usePagination(filtered);

  const resetToFirstPage = () => setPage(1);

  if (isInitializing) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <PageHeader title="Transactions" description="Every payment made from your wallet" />
        <Card className="p-8">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <PageHeader title="Transactions" description="Every payment made from your wallet" />

      <Card className="p-3.5">
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(220px,1fr)_10rem_9rem_auto] lg:items-center">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetToFirstPage();
              }}
              placeholder="Search by type, reference, or recipient"
              className={`${inputCls} pl-9`}
            />
          </div>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              resetToFirstPage();
            }}
            className={selectCls}
          >
            <option value="all">All types</option>
            {Object.entries(transactionTypeMeta).map(([id, meta]) => (
              <option key={id} value={id}>{meta.label}</option>
            ))}
          </select>
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value as Period | "all");
              resetToFirstPage();
            }}
            className={selectCls}
          >
            <option value="all">All time</option>
            {Object.entries(periodLabels).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {["all", "success", "pending", "fail"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setStatus(f);
                  resetToFirstPage();
                }}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  status === f ? "bg-[#111827] text-white shadow-sm shadow-[#111827]/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f === "fail" ? "failed" : f}
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
          <button
            onClick={() => exportCsv(filtered)}
            disabled={filtered.length === 0}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions found" description="Try adjusting your search or filters" />
        ) : (
          <>
            <div className="divide-y divide-slate-100 sm:hidden">
              {paginatedTransactions.map((tx) => {
                const meta = transactionTypeMeta[tx.transaction_type] ?? { label: tx.transaction_type, icon: Receipt };
                const credit = isCredit(tx);
                const amount = toNumber(tx.amount);
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => setSelectedTx(tx)}
                    className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                      <meta.icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{meta.label}</p>
                          <p className="truncate text-xs text-slate-400">
                            {tx.receiver ?? tx.account_or_phone ?? tx.transaction_reference}
                          </p>
                        </div>
                        <p className={`shrink-0 text-right text-sm font-semibold tabular-nums ${credit ? "text-emerald-600" : "text-slate-900"}`}>
                          {credit ? "+" : "-"}{fmt(amount)}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-slate-400">{tx.transaction_reference}</span>
                        <StatusBadge status={badgeStatus(tx.status)} />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{dateLabel(tx.created_at)}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[720px] text-sm">
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
                  {paginatedTransactions.map((tx) => {
                    const meta = transactionTypeMeta[tx.transaction_type] ?? { label: tx.transaction_type, icon: Receipt };
                    const credit = isCredit(tx);
                    const amount = toNumber(tx.amount);
                    return (
                      <tr key={tx.id} onClick={() => setSelectedTx(tx)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                              <meta.icon className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-slate-900 font-medium truncate">{meta.label}</p>
                              <p className="text-slate-400 text-xs truncate">
                                {tx.receiver ?? tx.account_or_phone ?? "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-400 text-xs font-mono whitespace-nowrap">{tx.transaction_reference}</td>
                        <td className={`px-3 py-3 text-right font-medium tabular-nums whitespace-nowrap ${credit ? "text-emerald-600" : "text-slate-900"}`}>
                          {credit ? "+" : "-"}{fmt(amount)}
                        </td>
                        <td className="px-3 py-3"><StatusBadge status={badgeStatus(tx.status)} /></td>
                        <td className="px-4 py-3 text-right text-slate-400 text-xs whitespace-nowrap">{dateLabel(tx.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              label="records"
            />
          </>
        )}
      </Card>

      {selectedTx && (() => {
        const meta = transactionTypeMeta[selectedTx.transaction_type] ?? { label: selectedTx.transaction_type, icon: Receipt };
        const credit = isCredit(selectedTx);
        const amount = toNumber(selectedTx.amount);
        const fee = toNumber(selectedTx.service_fee);
        const discount = toNumber(selectedTx.discount_amount);
        const quantity = toNumber(selectedTx.quantity);
        const isDataType = selectedTx.transaction_type === "data_subscription" || selectedTx.transaction_type === "data_pin";
        const isFundingType = selectedTx.transaction_type === "wallet_funding" || selectedTx.transaction_type === "manual_funding";
        const completedDiffersFromCreated =
          selectedTx.completed_at && selectedTx.completed_at !== selectedTx.created_at;

        const detailRows: [string, string][] = [
          ["Recipient", selectedTx.receiver ?? selectedTx.account_or_phone ?? "—"],
          ["Provider", selectedTx.provider ?? "—"],
        ];
        if (isDataType && quantity > 0) detailRows.push(["Quantity", `${quantity}GB`]);
        if (fee > 0) detailRows.push(["Fee", fmt(fee)]);
        if (discount > 0) detailRows.push(["Discount", `- ${fmt(discount)}`]);
        if (isFundingType && selectedTx.funding_method) {
          detailRows.push(["Funding method", selectedTx.funding_method.replace("_", " ")]);
        }
        detailRows.push(["Date & time", dateLabel(selectedTx.created_at)]);
        if (completedDiffersFromCreated) {
          detailRows.push(["Completed at", dateLabel(selectedTx.completed_at as string)]);
        }

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40">
            <div className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white shadow-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 text-sm">Transaction details</h3>
                <button onClick={() => setSelectedTx(null)} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <div className="flex flex-col items-center mb-3.5 pb-3.5 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    <meta.icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className={`text-lg font-semibold ${credit ? "text-emerald-600" : "text-slate-900"}`}>
                    {credit ? "+" : "-"}{fmt(amount)}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">{meta.label}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <StatusBadge status={badgeStatus(selectedTx.status)} />
                    {selectedTx.refunded_at && (
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                        Refunded
                      </span>
                    )}
                  </div>
                </div>

                {selectedTx.token && (
                  <div className="mb-2.5 rounded-xl border border-[#111827]/15 bg-[#111827]/10 px-3 py-2.5">
                    <p className="text-xs font-medium text-[#111827] mb-0.5">Your PIN / token</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold tracking-wide text-[#111827] break-all">
                        {selectedTx.token}
                      </span>
                      <CopyButton value={selectedTx.token} label="PIN" />
                    </div>
                  </div>
                )}

                <div className="mb-2.5 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
                  <span className="shrink-0 text-slate-500">Reference</span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span
                      className="min-w-0 flex-1 truncate text-right font-medium text-slate-900"
                      title={selectedTx.transaction_reference}
                    >
                      {selectedTx.transaction_reference}
                    </span>
                    <CopyButton value={selectedTx.transaction_reference} label="reference" />
                  </span>
                </div>

                <div className="space-y-1.5 text-sm">
                  {detailRows.map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-3">
                      <span className="shrink-0 text-slate-500">{k}</span>
                      <span className="min-w-0 break-words text-right font-medium text-slate-900 capitalize">{v}</span>
                    </div>
                  ))}
                </div>

                {selectedTx.refunded_at && (
                  <div className="mt-2.5 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2.5">
                    <p className="text-xs font-medium text-sky-700">
                      Refunded {dateLabel(selectedTx.refunded_at)}
                    </p>
                    {selectedTx.refund_reason && (
                      <p className="mt-1 text-sm text-sky-900">{selectedTx.refund_reason}</p>
                    )}
                  </div>
                )}

                {selectedTx.response_message && (
                  <div className="mt-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                    <p className="text-xs font-medium text-slate-400">Note</p>
                    <p className="mt-1 text-sm text-slate-700 break-words">{selectedTx.response_message}</p>
                  </div>
                )}

                <Button
                  variant="secondary"
                  fullWidth
                  className="mt-3.5"
                  onClick={() => printReceipt(selectedTx)}
                >
                  <Printer className="w-4 h-4" /> Print receipt
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
