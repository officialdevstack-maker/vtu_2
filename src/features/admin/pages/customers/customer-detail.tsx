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
  CalendarDays,
  Mail,
  Phone,
  UserCog,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  StatCard,
  StatusBadge,
  EmptyState,
  Pagination,
  inputCls,
  selectCls,
  SkeletonLine,
  CopyButton,
} from "../../../user/components/shared-ui";
import { usePagination } from "../../../../shared/pagination";
import { fmt } from "../../../user/data/mock";
import { startImpersonation } from "@/shared/impersonation";
import { extractErrorMessage } from "../settings/shared";
import { apiClient } from "@/shared/api/apiClient";
import {
  customerService,
  transactionService,
  type Customer,
  type Transaction,
} from "./service";

const formatDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const row = (label: string, value: React.ReactNode) => (
  <div className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
    <span className="text-xs text-slate-400 w-32 shrink-0 pt-0.5">{label}</span>
    <span className="text-xs text-slate-800 flex-1 min-w-0">{value ?? "—"}</span>
  </div>
);

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
        <p className="text-xs text-slate-400">
          Each credit or debit is written to the customer's transaction history.
        </p>
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
        <div className="divide-y divide-gray-50 md:hidden">
          {paginatedTransactions.map((t) => (
            <div key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {formatTxnType(t.transaction_type)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDateTime(t.created_at)}
                  </p>
                </div>
                <StatusBadge status={badgeStatus(t.status)} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-400">Amount</p>
                  <p className="mt-0.5 font-semibold tabular-nums text-slate-900">
                    {fmt(t.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Provider</p>
                  <p className="mt-0.5 truncate font-medium text-slate-700">
                    {t.provider ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Recipient</p>
                  <p className="mt-0.5 truncate font-medium text-slate-700">
                    {t.recipient || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Reference</p>
                  <p className="mt-0.5 truncate font-mono text-slate-500">
                    {t.reference || "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
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

  const [suspending, setSuspending] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [funding, setFunding] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [showRecentAuth, setShowRecentAuth] = useState(false);
  const [recentAuthPassword, setRecentAuthPassword] = useState("");
  const [recentAuthError, setRecentAuthError] = useState<string | null>(null);
  const [confirmingIdentity, setConfirmingIdentity] = useState(false);

  const back = () => navigate("/admin/customers/users");

  // Always re-fetch, even when the row was passed through navigation state —
  // the list row may be stale (e.g. after an edit on the form page).
  useEffect(() => {
    if (!id) return;
    customerService
      .getById(id)
      .then((c) => {
        setCustomer(c);
        setNotFound(false);
      })
      .catch(() => {
        setNotFound(true);
        setCustomer(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

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

  const handleImpersonate = async () => {
    if (!id) return;
    setImpersonating(true);
    setError(null);
    try {
      await customerService.impersonate(id);
      // The backend has switched the HttpOnly session. Reload under the
      // customer identity without exposing either account's credentials.
      startImpersonation(`/admin/customers/users/${id}`);
    } catch (err) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === "RECENT_AUTH_REQUIRED") {
        setShowRecentAuth(true);
        setRecentAuthError(null);
      } else {
        setError(extractErrorMessage(err));
      }
      setImpersonating(false);
    }
  };

  const confirmIdentityAndRetry = async () => {
    if (!recentAuthPassword) return;
    setConfirmingIdentity(true);
    setRecentAuthError(null);
    try {
      await apiClient.post("/security/re-authenticate", { password: recentAuthPassword });
      setShowRecentAuth(false);
      setRecentAuthPassword("");
      await handleImpersonate();
    } catch (err) {
      setRecentAuthError(extractErrorMessage(err));
    } finally {
      setConfirmingIdentity(false);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonLine key={i} className="h-20 w-full" />)}
        </div>
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

  const displayName = customer.username || customer.name;

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title={
            <div className="flex items-center gap-2">
              <button
                onClick={back}
                className="p-1 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              {displayName}
              <StatusBadge status={customer.status} />
            </div>
          }
          description={customer.email}
          actions={
            <Button
              size="sm"
              onClick={() =>
                navigate(`/admin/customers/users/${customer.id}/edit`, {
                  state: { customer },
                })
              }
            >
              <Pencil className="w-3.5 h-3.5" /> Edit customer
            </Button>
          }
        />

        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Wallet balance"
            value={fmt(customer.balance)}
            icon={Wallet}
            tone="success"
            meta="Available funds"
          />
          <StatCard
            label="Transactions"
            value={String(customer.txns)}
            icon={Receipt}
            tone="neutral"
            meta="All-time purchases"
          />
          <StatCard
            label="Verification"
            value={customer.kyc === "verified" ? "Verified" : customer.kyc === "pending" ? "Pending" : "Unverified"}
            icon={ShieldCheck}
            tone={customer.kyc === "verified" ? "success" : "neutral"}
            meta="Email verification"
          />
          <StatCard
            label="Date joined"
            value={formatDate(customer.dateJoined)}
            icon={CalendarDays}
            tone="neutral"
            meta="Registration date"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-11 h-11 bg-[#111827]/10 text-[#111827] rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                  {initials(displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{customer.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                    <span className="inline-flex items-center gap-1 min-w-0">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </span>
                    {customer.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {customer.phone}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge status={customer.kyc} />
              </div>
              <div className="px-5 py-1">
                {row("Username", customer.username)}
                {row("Full name", customer.name)}
                {row(
                  "Email",
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{customer.email}</span>
                    {customer.email && <CopyButton value={customer.email} label="email" />}
                  </span>,
                )}
                {row(
                  "Phone",
                  <span className="flex items-center gap-2 min-w-0">
                    <span>{customer.phone || "—"}</span>
                    {customer.phone && <CopyButton value={customer.phone} label="phone" />}
                  </span>,
                )}
                {row("Role", <span className="capitalize">{customer.roleName ?? "—"}</span>)}
                {row("Status", <StatusBadge status={customer.status} />)}
                {row("Date joined", formatDate(customer.dateJoined))}
              </div>
            </Card>

            <TransactionsCard userId={customer.id} />
          </div>

          {/* ── Right column ── */}
          <div className="space-y-5">
            <FundWalletCard onSubmit={(amt, type) => void handleFund(amt, type)} submitting={funding} />

            <Card className="p-5">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                Account actions
              </h2>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  fullWidth
                  size="sm"
                  disabled={impersonating}
                  loading={impersonating}
                  onClick={() => void handleImpersonate()}
                >
                  <UserCog className="w-3.5 h-3.5" />
                  {impersonating ? "Starting session…" : "Sign in as customer"}
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  size="sm"
                  onClick={() => setConfirmSuspend(true)}
                >
                  {customer.status === "suspended" ? (
                    <><ShieldCheck className="w-3.5 h-3.5" /> Reactivate account</>
                  ) : (
                    <><Ban className="w-3.5 h-3.5" /> Suspend account</>
                  )}
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete customer
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                "Sign in as customer" opens their dashboard in this tab — use
                the banner to return. Suspending blocks login until
                reactivated. Deleting is permanent and removes the account
                entirely.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {confirmSuspend && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl p-4">
            <div className="flex gap-2.5 bg-amber-50 border border-amber-100 rounded-lg px-3.5 py-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                {customer.status === "suspended"
                  ? `${displayName} will regain full access to their account.`
                  : `${displayName} will lose access to their account until reactivated.`}
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
                This permanently deletes {displayName}'s account and cannot be undone.
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

      {showRecentAuth && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="recent-auth-title">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#111827] text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h2 id="recent-auth-title" className="text-base font-semibold text-slate-900">Confirm it’s you</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Enter your admin password before starting this sensitive support session.</p>
            <input
              type="password"
              autoFocus
              autoComplete="current-password"
              value={recentAuthPassword}
              onChange={(event) => setRecentAuthPassword(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") void confirmIdentityAndRetry(); }}
              placeholder="Your password"
              className={`${inputCls} mt-4`}
            />
            {recentAuthError && <p className="mt-2 text-xs text-red-600">{recentAuthError}</p>}
            <div className="mt-4 flex gap-3">
              <Button variant="secondary" fullWidth disabled={confirmingIdentity} onClick={() => { setShowRecentAuth(false); setRecentAuthPassword(""); }}>
                Cancel
              </Button>
              <Button fullWidth loading={confirmingIdentity} disabled={!recentAuthPassword || confirmingIdentity} onClick={() => void confirmIdentityAndRetry()}>
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
