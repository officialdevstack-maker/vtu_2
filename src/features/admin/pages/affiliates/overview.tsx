import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightLeft,
  Eye,
  EyeOff,
  ListChecks,
  RefreshCw,
  Users,
  Wallet2,
} from "lucide-react";
import {
  Button,
  Card,
  CopyButton,
  SkeletonLine,
  StatCard,
} from "../../../user/components/shared-ui";
import {
  childCustomerService,
  childDirectiveService,
  childInstanceService,
  childTransactionService,
  type ChildCustomer,
  type ChildDirective,
  type ChildTransaction,
} from "./service";
import { useAffiliate } from "./affiliate-layout";
import { fmt } from "./modals";

const row = (label: string, value: React.ReactNode) => (
  <div className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
    <span className="text-xs text-slate-400 w-28 shrink-0 pt-0.5">{label}</span>
    <span className="text-xs text-slate-800 flex-1 min-w-0">{value ?? "—"}</span>
  </div>
);

export default function AffiliateOverviewPage() {
  const { instance } = useAffiliate();
  const id = String(instance.id);

  const [secret, setSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [customers, setCustomers] = useState<ChildCustomer[] | null>(null);
  const [transactions, setTransactions] = useState<ChildTransaction[] | null>(null);
  const [directives, setDirectives] = useState<ChildDirective[] | null>(null);

  useEffect(() => {
    childCustomerService.getByInstance(id).then(setCustomers);
    childTransactionService.getByInstance(id).then(setTransactions);
    childDirectiveService.getByInstance(id).then(setDirectives);
  }, [id]);

  const migrated = customers?.filter((c) => c.migrated_to_user_id).length ?? 0;
  const pendingDirectives = directives?.filter((d) => d.status === "pending").length ?? 0;
  const volume = transactions?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) ?? 0;

  const handleRevealSecret = async () => {
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

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Synced customers" value={customers ? String(customers.length) : "…"} icon={Users} />
        <StatCard label="Migrated to parent" value={customers ? String(migrated) : "…"} icon={ArrowRightLeft} tone={migrated > 0 ? "success" : "neutral"} />
        <StatCard label="Synced transactions" value={transactions ? String(transactions.length) : "…"} icon={Wallet2} meta={transactions ? `${fmt(volume)} total` : undefined} />
        <StatCard label="Pending directives" value={directives ? String(pendingDirectives) : "…"} icon={ListChecks} tone={pendingDirectives > 0 ? "warning" : "neutral"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Connection</h2>
          </div>
          <div className="px-5 py-1">
            {row("Slug", <span className="font-mono flex items-center gap-2">{instance.slug}<CopyButton value={instance.slug} label="slug" /></span>)}
            {row("Base URL", instance.base_url)}
            {row("Health", instance.health_status)}
            {row(
              "Last check-in",
              instance.last_seen_at ? new Date(instance.last_seen_at).toLocaleString() : "Never",
            )}
            {row(
              "Registered",
              instance.registered_at ? new Date(instance.registered_at).toLocaleString() : "Not yet",
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

        <Card>
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent directives</h2>
            <Link to="directives" className="text-xs font-medium text-[#111827] hover:underline">
              View all
            </Link>
          </div>
          {directives === null ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <SkeletonLine key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : directives.length === 0 ? (
            <div className="p-5">
              <p className="text-xs text-slate-400">
                Nothing sent yet. Remote actions you take on the{" "}
                <Link to="controls" className="underline">Controls</Link> page (redirects, provider
                rerouting, process toggles) land here as directives the child picks up on its next
                poll.
              </p>
            </div>
          ) : (
            <div className="px-5 py-1">
              {directives.slice(0, 6).map((d) => (
                <div key={d.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-slate-700 font-medium flex-1 truncate">{d.type}</span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      d.status === "delivered"
                        ? "bg-emerald-50 text-emerald-600"
                        : d.status === "failed"
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {d.status}
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {d.created_at ? new Date(d.created_at).toLocaleDateString() : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
