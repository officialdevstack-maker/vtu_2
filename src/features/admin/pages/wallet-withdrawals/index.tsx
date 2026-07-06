import { useEffect, useMemo, useState } from "react";
import {
  Landmark,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  SkeletonLine,
  StatusBadge,
  inputCls,
  selectCls,
  Pagination,
} from "../../../user/components/shared-ui";
import { usePagination } from "@shared/pagination";
import { Toolbar } from "../products/airtime-data/shared";
import {
  walletWithdrawalService,
  type WalletWithdrawal,
  type WalletWithdrawalStatus,
} from "./service";

const formatCurrency = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(value);
};

type SortKey = "id" | "amount" | "created_at";
type SortState = { key: SortKey; direction: "asc" | "desc" };

const SORT_COLUMNS: { key: SortKey; label: string; align?: "left" | "right" }[] = [
  { key: "id", label: "ID", align: "left" },
  { key: "amount", label: "Amount" },
  { key: "created_at", label: "Submitted" },
];

function sortValue(w: WalletWithdrawal, key: SortKey): string | number {
  switch (key) {
    case "id":
      return Number(w.id);
    case "amount":
      return Number(w.amount);
    case "created_at":
      return new Date(w.created_at).getTime();
  }
}

function RejectModal({
  withdrawal,
  onConfirm,
  onClose,
  saving,
}: {
  withdrawal: WalletWithdrawal;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-lg p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-1">Reject withdrawal</h3>
        <p className="text-xs text-slate-500 mb-3">
          {formatCurrency(withdrawal.amount)} to {withdrawal.bank_name} · {withdrawal.account_number}. The reserved amount will be refunded to the customer's wallet.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (shown to the customer)"
          rows={3}
          className={`${inputCls} resize-none`}
        />
        <div className="flex gap-3 mt-4">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            disabled={reason.trim().length === 0 || saving}
            loading={saving}
            onClick={() => onConfirm(reason.trim())}
          >
            Reject &amp; refund
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApproveModal({
  withdrawal,
  onConfirm,
  onClose,
  saving,
}: {
  withdrawal: WalletWithdrawal;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-lg p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-1">Approve withdrawal</h3>
        <p className="text-xs text-slate-500 mb-4">
          This attempts to pay {formatCurrency(withdrawal.amount)} to {withdrawal.account_name} ({withdrawal.bank_name} · {withdrawal.account_number}) right now via the payment gateway. If the payout fails, the amount is automatically refunded to the customer.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth disabled={saving} loading={saving} onClick={onConfirm}>
            Approve &amp; pay out
          </Button>
        </div>
      </div>
    </div>
  );
}

const WalletWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState<WalletWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WalletWithdrawalStatus | "">("pending");
  const [sort, setSort] = useState<SortState>({ key: "created_at", direction: "desc" });
  const [modal, setModal] = useState<
    { kind: "approve" | "reject"; withdrawal: WalletWithdrawal } | null
  >(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    walletWithdrawalService.getAll().then(setWithdrawals).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  };

  const handleApprove = async () => {
    if (modal?.kind !== "approve") return;
    setSaving(true);
    try {
      const updated = await walletWithdrawalService.approve(modal.withdrawal.id);
      setWithdrawals((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (modal?.kind !== "reject") return;
    setSaving(true);
    try {
      const updated = await walletWithdrawalService.reject(modal.withdrawal.id, reason);
      setWithdrawals((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = withdrawals.filter((w) => {
      if (status && w.status !== status) return false;
      if (!q) return true;
      return (
        w.bank_name.toLowerCase().includes(q) ||
        w.account_number.toLowerCase().includes(q) ||
        w.account_name.toLowerCase().includes(q) ||
        w.transaction_reference.toLowerCase().includes(q) ||
        (w.user?.username ?? "").toLowerCase().includes(q)
      );
    });

    return [...rows].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      if (av < bv) return sort.direction === "asc" ? -1 : 1;
      if (av > bv) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [withdrawals, search, status, sort]);

  const { currentPage, totalPages, totalItems, pageSize, pageItems, setPage } = usePagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [search, status, sort, setPage]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Wallet Withdrawals"
        description="Review customer bank withdrawal requests. Approving attempts payout immediately via the active payment gateway."
      />

      <Card className="overflow-hidden">
        <Toolbar>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bank, account, username, reference..."
              className={`${inputCls} pl-9 py-2`}
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as WalletWithdrawalStatus | "")}
            className={`${selectCls} py-2 w-full sm:w-40`}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="rejected">Rejected</option>
          </select>
        </Toolbar>

        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <SkeletonLine key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title={search || status ? "No withdrawals match your filters" : "No withdrawals yet"}
            description={
              search || status ? "Try a different search or filter." : "Customer withdrawal requests will show up here."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {SORT_COLUMNS.map((c) => (
                    <th
                      key={c.key}
                      className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap cursor-pointer select-none ${c.align === "right" ? "text-right" : "text-left"}`}
                      onClick={() => toggleSort(c.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {sort.key === c.key ? (
                          sort.direction === "asc" ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-500 text-left">Customer</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-500 text-left">Bank details</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-500 text-left">Status</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500">#{w.id}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">{formatCurrency(w.amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(w.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{w.user?.username ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <p className="font-medium text-slate-900">{w.bank_name}</p>
                      <p className="font-mono">{w.account_number}</p>
                      <p className="text-slate-400">{w.account_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={w.status} />
                      {(w.status === "rejected" || w.status === "failed") && w.rejection_reason && (
                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-[160px] truncate" title={w.rejection_reason}>
                          {w.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {w.status === "pending" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setModal({ kind: "approve", withdrawal: w })}
                            title="Approve"
                            className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setModal({ kind: "reject", withdrawal: w })}
                            title="Reject"
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-center text-[11px] text-slate-400">
                          {w.reviewer?.username ? `by ${w.reviewer.username}` : "—"}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </Card>

      {modal?.kind === "approve" && (
        <ApproveModal
          withdrawal={modal.withdrawal}
          onConfirm={() => void handleApprove()}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.kind === "reject" && (
        <RejectModal
          withdrawal={modal.withdrawal}
          onConfirm={(reason) => void handleReject(reason)}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </div>
  );
};

export default WalletWithdrawalsPage;
