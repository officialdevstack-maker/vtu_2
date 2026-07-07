import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Eye,
  EyeOff,
  RefreshCw,
  Users,
  Wallet2,
  ListChecks,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  StatusBadge,
  SkeletonLine,
  CopyButton,
  EmptyState,
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
    return <EmptyState icon={ListChecks} title="No directives sent yet" description="Guidance you send this affiliate (redirects, retry instructions, etc.) will appear here — a Phase 2 capability." />;
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

  const back = () => navigate("/admin/affiliates");

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
    </div>
  );
}
