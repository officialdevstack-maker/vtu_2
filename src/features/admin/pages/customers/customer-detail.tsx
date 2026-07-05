import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Ban,
  ShieldCheck,
  Wallet,
  AlertTriangle,
  Receipt,
  X,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  StatusBadge,
  EmptyState,
  Pagination,
  inputCls,
  selectCls,
  SkeletonLine,
} from "../../../user/components/shared-ui";
import { usePagination } from "../../../../shared/pagination";
import { fmt } from "../../../user/data/mock";
import {
  customerService,
  transactionService,
  type Customer,
  type CustomerPayload,
  type Transaction,
} from "./service";

type CustomerStatus = "active" | "suspended" | "inactive";

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const row = (label: string, value: React.ReactNode) => (
  <div className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
    <span className="text-xs text-slate-400 w-32 shrink-0 pt-0.5">{label}</span>
    <span className="text-xs text-slate-800 flex-1">{value ?? "—"}</span>
  </div>
);

// ─── Edit modal ─────────────────────────────────────────────────────────────

function EditModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: CustomerPayload;
  onSave: (payload: CustomerPayload) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<CustomerPayload>(initial);
  const set = <K extends keyof CustomerPayload>(k: K, v: CustomerPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim().length > 0 && form.email.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="font-semibold text-slate-900 text-sm">Edit customer</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
            <input value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as CustomerStatus)}
              className={selectCls}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
            <Button fullWidth disabled={!valid || saving} loading={saving} onClick={() => onSave(form)}>
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Fund / debit wallet card ───────────────────────────────────────────────

function FundWalletCard({
  onSubmit,
  submitting,
}: {
  onSubmit: (amount: number, type: "credit" | "debit") => void;
  submitting: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"credit" | "debit">("credit");
  const valid = Number(amount) > 0;

  return (
    <Card className="p-5">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Fund / debit wallet
      </h2>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Amount (₦)</label>
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 5000"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Action</label>
          <select value={type} onChange={(e) => setType(e.target.value as "credit" | "debit")} className={selectCls}>
            <option value="credit">Credit wallet</option>
            <option value="debit">Debit wallet</option>
          </select>
        </div>
        <Button
          fullWidth
          variant={type === "debit" ? "danger" : "primary"}
          disabled={!valid || submitting}
          loading={submitting}
          onClick={() => {
            onSubmit(Number(amount), type);
            setAmount("");
          }}
        >
          <Wallet className="w-3.5 h-3.5" />
          {type === "debit" ? "Debit wallet" : "Credit wallet"}
        </Button>
      </div>
    </Card>
  );
}

// ─── Transactions ───────────────────────────────────────────────────────────

const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

const formatTxnType = (type: string) =>
  type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// StatusBadge's tone map doesn't recognize "fail" (only "failed").
const badgeStatus = (status: Transaction["status"]) => (status === "fail" ? "failed" : status);

function TransactionsCard({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const {
    currentPage,
    pageItems: paginatedTransactions,
    pageSize,
    setPage,
    totalItems,
    totalPages,
  } = usePagination(transactions);

  useEffect(() => {
    let mounted = true;
    transactionService
      .getByUser(userId)
      .then((data) => {
        if (mounted) setTransactions(data);
      })
      .catch(() => {
        if (mounted) setFailed(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  return (
    <Card>
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Transactions
        </h2>
        {!loading && transactions.length > 0 && (
          <span className="text-xs text-slate-400">{transactions.length} records</span>
        )}
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonLine className="h-4 flex-1" />
              <SkeletonLine className="h-4 w-20" />
              <SkeletonLine className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : failed ? (
        <div className="px-5 py-10 text-center">
          <p className="text-xs text-slate-400">Could not load transactions for this customer.</p>
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions yet"
          description="Purchases made by this customer will appear here."
        />
      ) : (
        <>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                {["Date", "Type", "Provider", "Recipient", "Amount", "Reference", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(t.created_at)}</td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatTxnType(t.transaction_type)}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{t.provider ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{t.recipient || "—"}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 tabular-nums whitespace-nowrap">
                    {fmt(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono whitespace-nowrap">{t.reference || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={badgeStatus(t.status)} />
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
          label="records"
        />
        </>
      )}
    </Card>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CustomerDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [customer, setCustomer] = useState<Customer | null>(
    (location.state as { customer?: Customer } | null)?.customer ?? null,
  );
  const [loading, setLoading] = useState(!customer);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [funding, setFunding] = useState(false);

  const back = () => navigate("/admin/customers/users");

  useEffect(() => {
    if (!id || customer) return;
    customerService
      .getById(id)
      .then(setCustomer)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [customer, id]);

  const handleSave = async (payload: CustomerPayload) => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await customerService.update(id, payload);
      setCustomer(updated);
      setEditing(false);
    } catch {
      setError("The customer could not be saved right now.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!customer) return;
    setSuspending(true);
    setError(null);
    try {
      const updated = await customerService.toggleStatus(customer);
      setCustomer(updated);
    } catch {
      setError("The account status could not be changed right now.");
    } finally {
      setSuspending(false);
      setConfirmSuspend(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setError(null);
    try {
      await customerService.remove(id);
      back();
    } catch {
      setError("The customer could not be deleted right now.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleFund = async (amount: number, type: "credit" | "debit") => {
    if (!id) return;
    setFunding(true);
    setError(null);
    try {
      const updated = await customerService.fundWallet(id, amount, type);
      setCustomer(updated);
    } catch {
      setError("The wallet could not be updated right now.");
    } finally {
      setFunding(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonLine className="h-7 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-5 space-y-3">
              {[...Array(6)].map((_, i) => <SkeletonLine key={i} className="h-4 w-full" />)}
            </Card>
          </div>
          <Card className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => <SkeletonLine key={i} className="h-8 w-full" />)}
          </Card>
        </div>
      </div>
    );
  }

  if (notFound || !customer) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Customer"
          actions={
            <Button variant="secondary" size="sm" onClick={back}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          }
        />
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500 mb-3">Customer not found.</p>
          <Button variant="secondary" size="sm" onClick={back}>Go back</Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title={customer.username || customer.name}
          description={customer.email}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={back}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmSuspend(true)}
              >
                {customer.status === "suspended" ? (
                  <><ShieldCheck className="w-3.5 h-3.5" /> Reactivate</>
                ) : (
                  <><Ban className="w-3.5 h-3.5" /> Suspend</>
                )}
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          }
        />

        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 bg-[#111827]/10 text-[#111827] rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                  {initials(customer.username || customer.name)}
                </div>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Customer details
                </h2>
                <StatusBadge status={customer.status} />
                <StatusBadge status={customer.kyc} />
              </div>
              <div className="px-5 py-1">
                {row("Username", customer.username)}
                {row("Full name", customer.name)}
                {row("Email", customer.email)}
                {row("Phone", customer.phone)}
                {row("Account type", customer.userType)}
                {row("Wallet balance", <span className="font-medium">{fmt(customer.balance)}</span>)}
                {row("Transactions", customer.txns)}
                {row("Date joined", formatDate(customer.dateJoined))}
              </div>
            </Card>

            <TransactionsCard userId={customer.id} />
          </div>

          {/* ── Right column ── */}
          <div className="space-y-5">
            <FundWalletCard onSubmit={(amt, type) => void handleFund(amt, type)} submitting={funding} />
          </div>
        </div>
      </div>

      {editing && (
        <EditModal
          initial={{
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            balance: customer.balance,
            status: customer.status,
            kyc: customer.kyc,
            username: customer.username,
            userType: customer.userType,
          }}
          onSave={(p) => void handleSave(p)}
          onClose={() => setEditing(false)}
          saving={saving}
        />
      )}

      {confirmSuspend && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl p-4">
            <div className="flex gap-2.5 bg-amber-50 border border-amber-100 rounded-lg px-3.5 py-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                {customer.status === "suspended"
                  ? `${customer.username || customer.name} will regain full access to their account.`
                  : `${customer.username || customer.name} will lose access to their account until reactivated.`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setConfirmSuspend(false)}>Cancel</Button>
              <Button
                variant={customer.status === "suspended" ? "primary" : "danger"}
                fullWidth
                disabled={suspending}
                loading={suspending}
                onClick={() => void handleToggleSuspend()}
              >
                {customer.status === "suspended" ? "Reactivate" : "Suspend"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl p-4">
            <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">
                This permanently deletes {customer.username || customer.name}'s account and cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button variant="danger" fullWidth disabled={deleting} loading={deleting} onClick={() => void handleDelete()}>
                Delete customer
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
