import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  ImageOff,
} from "lucide-react";
import {
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
  airtimeToCashRequestService,
  type AirtimeToCashRequest,
  type AirtimeToCashStatus,
} from "./service";

const formatCurrency = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(value);
};

type SortKey = "id" | "amount" | "payout_amount" | "created_at";
type SortState = { key: SortKey; direction: "asc" | "desc" };

const SORT_COLUMNS: { key: SortKey; label: string; align?: "left" | "right" }[] = [
  { key: "id", label: "ID", align: "left" },
  { key: "amount", label: "Amount" },
  { key: "payout_amount", label: "Payout" },
  { key: "created_at", label: "Submitted" },
];

function sortValue(r: AirtimeToCashRequest, key: SortKey): string | number {
  switch (key) {
    case "id":
      return Number(r.id);
    case "amount":
      return Number(r.amount);
    case "payout_amount":
      return Number(r.payout_amount);
    case "created_at":
      return new Date(r.created_at).getTime();
  }
}

function ProofModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <img
        src={src}
        alt="Proof of transfer"
        className="max-h-[80vh] max-w-full rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function RejectModal({
  request,
  onConfirm,
  onClose,
  saving,
}: {
  request: AirtimeToCashRequest;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-lg p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-1">Reject request</h3>
        <p className="text-xs text-slate-500 mb-3">
          {request.network.toUpperCase()} · {formatCurrency(request.amount)} from {request.sender_phone}. No wallet credit will be made.
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
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApproveModal({
  request,
  onConfirm,
  onClose,
  saving,
}: {
  request: AirtimeToCashRequest;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-lg p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-1">Approve request</h3>
        <p className="text-xs text-slate-500 mb-4">
          This credits {formatCurrency(request.payout_amount)} to {request.user?.username ?? "the customer"}'s wallet immediately. This can't be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth disabled={saving} loading={saving} onClick={onConfirm}>
            Approve &amp; credit
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AirtimeToCashRequestsTab() {
  const [requests, setRequests] = useState<AirtimeToCashRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AirtimeToCashStatus | "">("pending");
  const [sort, setSort] = useState<SortState>({ key: "created_at", direction: "desc" });
  const [proofSrc, setProofSrc] = useState<string | null>(null);
  const [modal, setModal] = useState<
    { kind: "approve" | "reject"; request: AirtimeToCashRequest } | null
  >(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    airtimeToCashRequestService.getAll().then(setRequests).finally(() => setLoading(false));
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
      const updated = await airtimeToCashRequestService.approve(modal.request.id);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (modal?.kind !== "reject") return;
    setSaving(true);
    try {
      const updated = await airtimeToCashRequestService.reject(modal.request.id, reason);
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = requests.filter((r) => {
      if (status && r.status !== status) return false;
      if (!q) return true;
      return (
        r.network.toLowerCase().includes(q) ||
        r.sender_phone.toLowerCase().includes(q) ||
        r.transaction_reference.toLowerCase().includes(q) ||
        (r.user?.username ?? "").toLowerCase().includes(q)
      );
    });

    return [...rows].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      if (av < bv) return sort.direction === "asc" ? -1 : 1;
      if (av > bv) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [requests, search, status, sort]);

  const { currentPage, totalPages, totalItems, pageSize, pageItems, setPage } = usePagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [search, status, sort, setPage]);

  return (
    <>
      <Card className="overflow-hidden">
        <Toolbar>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search network, phone, username, reference..."
              className={`${inputCls} pl-9 py-2`}
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AirtimeToCashStatus | "")}
            className={`${selectCls} py-2 w-full sm:w-40`}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
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
            icon={Banknote}
            title={search || status ? "No requests match your filters" : "No requests yet"}
            description={
              search || status ? "Try a different search or filter." : "Customer submissions will show up here."
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
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-500 text-left">Sender phone</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-500 text-center">Proof</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-500 text-left">Status</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-slate-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500">#{r.id}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-900">
                      {r.network.toUpperCase()} · {formatCurrency(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-emerald-700">{formatCurrency(r.payout_amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{r.user?.username ?? "—"}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-600">{r.sender_phone}</td>
                    <td className="px-4 py-3 text-center">
                      {r.proof_image ? (
                        <button
                          onClick={() => setProofSrc(r.proof_image)}
                          className="text-[#111827] hover:opacity-70 transition-opacity text-xs underline"
                        >
                          View
                        </button>
                      ) : (
                        <ImageOff className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                      {r.status === "rejected" && r.rejection_reason && (
                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-[160px] truncate" title={r.rejection_reason}>
                          {r.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === "pending" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setModal({ kind: "approve", request: r })}
                            title="Approve"
                            className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setModal({ kind: "reject", request: r })}
                            title="Reject"
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-center text-[11px] text-slate-400">
                          {r.reviewer?.username ? `by ${r.reviewer.username}` : "—"}
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

      {proofSrc && <ProofModal src={proofSrc} onClose={() => setProofSrc(null)} />}

      {modal?.kind === "approve" && (
        <ApproveModal
          request={modal.request}
          onConfirm={() => void handleApprove()}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.kind === "reject" && (
        <RejectModal
          request={modal.request}
          onConfirm={(reason) => void handleReject(reason)}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </>
  );
}
