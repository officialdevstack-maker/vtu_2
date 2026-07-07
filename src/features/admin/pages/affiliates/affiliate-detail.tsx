import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Pencil,
  Eye,
  EyeOff,
  RefreshCw,
  Users,
  Wallet2,
  ListChecks,
  Send,
  X,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  StatusBadge,
  SkeletonLine,
  CopyButton,
  EmptyState,
  inputCls,
} from "../../../user/components/shared-ui";
import { usePagination } from "@shared/pagination";
import {
  childInstanceService,
  childCustomerService,
  childTransactionService,
  childDirectiveService,
  type ChildInstance,
  type ChildCustomer,
  type ChildTransaction,
  type ChildDirective,
  type DirectiveType,
} from "./service";

const fmt = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(v);
};

const row = (label: string, value: React.ReactNode) => (
  <div className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
    <span className="text-xs text-slate-400 w-28 shrink-0 pt-0.5">{label}</span>
    <span className="text-xs text-slate-800 flex-1 min-w-0">{value ?? "—"}</span>
  </div>
);

type Tab = "customers" | "transactions" | "directives";

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Users;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${
        active ? "bg-[#111827] text-white" : "text-slate-500 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      <span className={`text-[10px] ${active ? "text-white/70" : "text-slate-400"}`}>{count}</span>
    </button>
  );
}

function CustomersTable({ customers }: { customers: ChildCustomer[] }) {
  const { pageItems, currentPage, totalPages, totalItems, pageSize, setPage } = usePagination(customers);
  if (customers.length === 0) {
    return <EmptyState icon={Users} title="No synced customers yet" description="They'll appear here once the affiliate's cron pushes a batch." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            {["External ID", "Username", "Email", "Phone", "Balance", "Status"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {pageItems.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-slate-500">{c.external_id}</td>
              <td className="px-4 py-3 text-slate-700">{c.username ?? "—"}</td>
              <td className="px-4 py-3 text-slate-500">{c.email ?? "—"}</td>
              <td className="px-4 py-3 text-slate-500">{c.phone ?? "—"}</td>
              <td className="px-4 py-3 text-slate-700 tabular-nums">{fmt(c.wallet_balance)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status ?? "pending"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="px-4 py-2.5 text-xs text-slate-400 border-t border-gray-100">
          Page {currentPage} of {totalPages} ({totalItems} total, {pageSize}/page) —{" "}
          <button className="underline" onClick={() => setPage(currentPage + 1 > totalPages ? 1 : currentPage + 1)}>
            next
          </button>
        </div>
      )}
    </div>
  );
}

function TransactionsTable({ transactions }: { transactions: ChildTransaction[] }) {
  const { pageItems, currentPage, totalPages, totalItems, pageSize, setPage } = usePagination(transactions);
  if (transactions.length === 0) {
    return <EmptyState icon={Wallet2} title="No synced transactions yet" description="They'll appear here once the affiliate's cron pushes a batch." />;
  }
  return (
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
      {totalPages > 1 && (
        <div className="px-4 py-2.5 text-xs text-slate-400 border-t border-gray-100">
          Page {currentPage} of {totalPages} ({totalItems} total, {pageSize}/page) —{" "}
          <button className="underline" onClick={() => setPage(currentPage + 1 > totalPages ? 1 : currentPage + 1)}>
            next
          </button>
        </div>
      )}
    </div>
  );
}

function DirectivesTable({ directives }: { directives: ChildDirective[] }) {
  if (directives.length === 0) {
    return <EmptyState icon={ListChecks} title="No directives sent yet" description="Guidance you send this affiliate (redirects, retry instructions, etc.) will appear here once you send one." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            {["Type", "Payload", "Status", "Created"].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {directives.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-slate-700">{d.type}</td>
              <td className="px-4 py-3 font-mono text-slate-500 max-w-xs truncate">{JSON.stringify(d.payload)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={d.status === "delivered" ? "success" : d.status === "failed" ? "failed" : "pending"} />
              </td>
              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                {d.created_at ? new Date(d.created_at).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (typeof data?.message === "string") return data.message;
  }
  return "Could not send the directive. Please try again.";
}

const DIRECTIVE_TYPE_OPTIONS: { value: DirectiveType; label: string; description: string }[] = [
  { value: "message", label: "Message", description: "A plain-text note for whoever operates this affiliate." },
  { value: "redirect_user", label: "Redirect user", description: "Ask the child to redirect a specific customer to the parent." },
  { value: "retry_transaction", label: "Retry transaction", description: "Ask the child to retry a specific failed transaction." },
  { value: "custom", label: "Custom", description: "Any other directive type, with a hand-written JSON payload." },
];

// Directive *types* are just labeled conventions between parent and child —
// nothing enforces this list server-side (ChildDirective::type is a plain
// string column). This UI just makes the two most obvious guidance actions
// easy to compose correctly, with an escape hatch for anything else.
function SendDirectiveModal({
  instanceId,
  onClose,
  onSent,
}: {
  instanceId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [type, setType] = useState<DirectiveType>("message");
  const [text, setText] = useState("");
  const [externalId, setExternalId] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [reason, setReason] = useState("");
  const [customType, setCustomType] = useState("");
  const [customPayload, setCustomPayload] = useState("{}");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildPayload = (): { type: string; payload: Record<string, unknown> } | null => {
    if (type === "message") {
      if (!text.trim()) return null;
      return { type: "message", payload: { text: text.trim() } };
    }
    if (type === "redirect_user") {
      if (!externalId.trim() || !targetUrl.trim()) return null;
      return { type: "redirect_user", payload: { external_id: externalId.trim(), target_url: targetUrl.trim() } };
    }
    if (type === "retry_transaction") {
      if (!externalId.trim()) return null;
      return { type: "retry_transaction", payload: { external_id: externalId.trim(), reason: reason.trim() } };
    }
    if (!customType.trim()) return null;
    try {
      const parsed = JSON.parse(customPayload || "{}") as Record<string, unknown>;
      return { type: customType.trim(), payload: parsed };
    } catch {
      return null;
    }
  };

  const built = buildPayload();
  const customJsonInvalid = type === "custom" && customPayload.trim() !== "" && built === null && customType.trim() !== "";

  const handleSend = async () => {
    if (!built) return;
    setSending(true);
    setError(null);
    try {
      await childDirectiveService.create(instanceId, built.type, built.payload);
      onSent();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">Send directive</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-xs text-red-600">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DirectiveType)}
              className={inputCls}
            >
              {DIRECTIVE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              {DIRECTIVE_TYPE_OPTIONS.find((o) => o.value === type)?.description}
            </p>
          </div>

          {type === "message" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="e.g. Please review your last 3 failed transactions."
                className={inputCls}
              />
            </div>
          )}

          {(type === "redirect_user" || type === "retry_transaction") && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Customer external ID <span className="text-red-400">*</span>
              </label>
              <input
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                placeholder="The child's own customer/user ID"
                className={inputCls}
              />
            </div>
          )}

          {type === "redirect_user" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Redirect URL <span className="text-red-400">*</span>
              </label>
              <input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
          )}

          {type === "retry_transaction" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Reason (optional)</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why this transaction should be retried"
                className={inputCls}
              />
            </div>
          )}

          {type === "custom" && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Custom type <span className="text-red-400">*</span>
                </label>
                <input
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="e.g. flag_for_review"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Payload (JSON)</label>
                <textarea
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  rows={4}
                  className={`${inputCls} font-mono`}
                />
                {customJsonInvalid && <p className="text-[11px] text-red-500 mt-1">Not valid JSON.</p>}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button fullWidth disabled={!built || sending} loading={sending} onClick={() => void handleSend()}>
              <Send className="w-3.5 h-3.5" /> Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AffiliateDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [instance, setInstance] = useState<ChildInstance | null>(
    (location.state as { instance?: ChildInstance } | null)?.instance ?? null,
  );
  const [loadingInstance, setLoadingInstance] = useState(!instance);

  const [secret, setSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [tab, setTab] = useState<Tab>("customers");
  const [customers, setCustomers] = useState<ChildCustomer[]>([]);
  const [transactions, setTransactions] = useState<ChildTransaction[]>([]);
  const [directives, setDirectives] = useState<ChildDirective[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showDirectiveModal, setShowDirectiveModal] = useState(false);

  const back = () => navigate("/admin/affiliates");

  const refreshDirectives = () => {
    if (!id) return;
    childDirectiveService.getByInstance(id).then(setDirectives);
  };

  useEffect(() => {
    if (!id) return;
    if (!instance) {
      setLoadingInstance(true);
      childInstanceService
        .getById(id)
        .then(setInstance)
        .finally(() => setLoadingInstance(false));
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoadingData(true);
    Promise.all([
      childCustomerService.getByInstance(id),
      childTransactionService.getByInstance(id),
      childDirectiveService.getByInstance(id),
    ])
      .then(([c, t, d]) => {
        setCustomers(c);
        setTransactions(t);
        setDirectives(d);
      })
      .finally(() => setLoadingData(false));
  }, [id]);

  const handleRevealSecret = async () => {
    if (!id) return;
    setLoadingSecret(true);
    try {
      const s = await childInstanceService.getSecret(id);
      setSecret(s);
      setShowSecret(true);
    } finally {
      setLoadingSecret(false);
    }
  };

  const handleRegenerateSecret = async () => {
    if (!id) return;
    if (!window.confirm("Regenerate the shared secret? The affiliate's PARENT_SYNC_SECRET must be updated to match, or its next sync will start failing signature checks.")) {
      return;
    }
    setRegenerating(true);
    try {
      const s = await childInstanceService.regenerateSecret(id);
      setSecret(s);
      setShowSecret(true);
    } finally {
      setRegenerating(false);
    }
  };

  if (loadingInstance) {
    return (
      <div className="space-y-5">
        <SkeletonLine className="h-7 w-48" />
        <Card className="p-5 space-y-3">
          {[...Array(4)].map((_, i) => (
            <SkeletonLine key={i} className="h-4 w-full" />
          ))}
        </Card>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Affiliate"
          actions={
            <Button variant="secondary" size="sm" onClick={back}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          }
        />
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500 mb-3">Affiliate not found.</p>
          <Button variant="secondary" size="sm" onClick={back}>
            Go back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={instance.name}
        description={instance.base_url ?? undefined}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={back}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/admin/affiliates/${id}/edit`, { state: { instance } })}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Instance details */}
        <div className="lg:col-span-1">
          <Card>
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Connection
              </h2>
              <StatusBadge
                status={
                  instance.status === "pending"
                    ? "pending"
                    : instance.status === "active"
                      ? "active"
                      : instance.status === "paused"
                        ? "inactive"
                        : "suspended"
                }
              />
            </div>
            <div className="px-5 py-1">
              {row("Slug", <span className="font-mono flex items-center gap-2">{instance.slug}<CopyButton value={instance.slug} label="slug" /></span>)}
              {row("Base URL", instance.base_url)}
              {row("Health", instance.health_status)}
              {row(
                "Last check-in",
                instance.last_seen_at ? new Date(instance.last_seen_at).toLocaleString() : "Never",
              )}
              {instance.status === "pending" ? (
                row("Shared secret", <span className="text-slate-400">Not set yet — awaiting registration</span>)
              ) : (
                row(
                  "Shared secret",
                  <span className="flex items-center gap-2">
                    {showSecret && secret ? (
                      <>
                        <span className="font-mono truncate max-w-[10rem]">{secret}</span>
                        <CopyButton value={secret} label="shared secret" />
                        <button type="button" onClick={() => setShowSecret(false)} className="text-slate-400 hover:text-slate-600">
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleRevealSecret()}
                        disabled={loadingSecret}
                        className="inline-flex items-center gap-1.5 text-[#111827] font-medium disabled:opacity-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {loadingSecret ? "Loading…" : "Reveal"}
                      </button>
                    )}
                  </span>,
                )
              )}
            </div>
            {instance.status === "pending" && (
              <div className="px-5 py-3 border-t border-gray-50 bg-amber-50">
                <p className="text-xs text-amber-700">
                  This affiliate hasn't connected yet. Generate a registration code from the list page
                  if you don't have it anymore, then run{" "}
                  <code className="font-mono">php artisan parent-sync:register &lt;code&gt;</code> on the
                  child app.
                </p>
              </div>
            )}
            {instance.status !== "pending" && (
              <div className="px-5 py-3.5 border-t border-gray-50">
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  disabled={regenerating}
                  loading={regenerating}
                  onClick={() => void handleRegenerateSecret()}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate secret
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Synced data */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 flex-wrap">
              <TabButton active={tab === "customers"} onClick={() => setTab("customers")} icon={Users} label="Customers" count={customers.length} />
              <TabButton active={tab === "transactions"} onClick={() => setTab("transactions")} icon={Wallet2} label="Transactions" count={transactions.length} />
              <TabButton active={tab === "directives"} onClick={() => setTab("directives")} icon={ListChecks} label="Directives" count={directives.length} />
              {tab === "directives" && (
                <Button size="sm" className="ml-auto" onClick={() => setShowDirectiveModal(true)}>
                  <Send className="w-3.5 h-3.5" /> Send directive
                </Button>
              )}
            </div>

            {loadingData ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <SkeletonLine key={i} className="h-4 w-full" />
                ))}
              </div>
            ) : tab === "customers" ? (
              <CustomersTable customers={customers} />
            ) : tab === "transactions" ? (
              <TransactionsTable transactions={transactions} />
            ) : (
              <DirectivesTable directives={directives} />
            )}
          </Card>
        </div>
      </div>

      {showDirectiveModal && id && (
        <SendDirectiveModal
          instanceId={id}
          onClose={() => setShowDirectiveModal(false)}
          onSent={refreshDirectives}
        />
      )}
    </div>
  );
}
