import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Power,
  Trash2,
  AlertTriangle,
  CreditCard,
  Zap,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  StatCard,
  StatusBadge,
  EmptyState,
  SkeletonCard,
  SkeletonRows,
} from "../../../user/components/shared-ui";
import { ActionMenu } from "../../../../shared/components/action-menu";
import {
  gatewayService,
  gatewaySupportsTransfer,
  type Gateway,
} from "./gatewayService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toId = (v: string | number) => String(v);

const fmt = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === "") return "—";
  // Strip grouping commas — Number("4,495") is NaN otherwise.
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(v);
};

// ─── Transfer support badge ───────────────────────────────────────────────────

function TransferBadge({ supported }: { supported: boolean }) {
  return supported ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#111827] bg-[#111827]/10 px-2 py-0.5 rounded-md">
      <Zap className="w-3 h-3" /> Transfers
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
      Transfers unavailable
    </span>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  last,
  total,
  from,
  to,
  onPage,
}: {
  page: number;
  last: number;
  total: number;
  from: number | null;
  to: number | null;
  onPage: (p: number) => void;
}) {
  if (last <= 1) return null;
  const pages: (number | "…")[] = [];
  if (last <= 7) {
    for (let i = 1; i <= last; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(last - 1, page + 1); i++)
      pages.push(i);
    if (page < last - 2) pages.push("…");
    pages.push(last);
  }
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 flex-wrap">
      <p className="text-xs text-slate-500 shrink-0">
        {from != null && to != null
          ? `Showing ${from}–${to} of ${total}`
          : `${total} total`}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-md text-slate-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`e-${i}`} className="px-1 text-xs text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors ${p === page ? "bg-[#111827] text-white" : "text-slate-600 hover:bg-gray-100"}`}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <span className="sm:hidden text-xs text-slate-600 px-2">
          {page} / {last}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === last}
          className="p-1.5 rounded-md text-slate-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  gateway,
  onConfirm,
  onClose,
  deleting,
}: {
  gateway: Gateway;
  onConfirm: () => void;
  onClose: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl p-4">
        <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">
            This permanently removes <strong>{gateway.name}</strong> and cannot
            be undone. Any vendors using this gateway for auto-funding will stop
            receiving transfers.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            disabled={deleting}
            loading={deleting}
            onClick={onConfirm}
          >
            Delete gateway
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const GatewayPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Gateway | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    gatewayService
      .getAll()
      .then(setGateways)
      .finally(() => setLoading(false));
  }, []);

  // client-side pagination
  const total = gateways.length;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(currentPage, lastPage);
  const slice = gateways.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from = total === 0 ? null : (page - 1) * PAGE_SIZE + 1;
  const to = total === 0 ? null : Math.min(page * PAGE_SIZE, total);

  const setPageQuery = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next, { replace: true });
  };

  // stats
  const connected = gateways.filter((g) => g.connection).length;
  const transferCapable = gateways.filter((g) =>
    gatewaySupportsTransfer(g.name),
  ).length;

  // handlers
  const openCreate = () => navigate("/admin/apis/gateway/new");

  const openView = (g: Gateway) =>
    navigate(`/admin/apis/gateway/${toId(g.id)}`, { state: { gateway: g } });

  const openEdit = (g: Gateway) =>
    navigate(`/admin/apis/gateway/${toId(g.id)}/edit`, { state: { gateway: g } });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await gatewayService.remove(toId(deleteTarget.id));
      setGateways((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (gateway: Gateway) => {
    const id = toId(gateway.id);
    setToggling(id);
    try {
      const updated = await gatewayService.toggleConnection(gateway);
      setGateways((prev) =>
        prev.map((g) => (g.id === updated.id ? updated : g)),
      );
    } finally {
      setToggling(null);
    }
  };

  const menuItems = (g: Gateway) => [
    { label: "Show", icon: Eye, onClick: () => openView(g) },
    { label: "Edit", icon: Pencil, onClick: () => openEdit(g) },
    {
      label: g.connection ? "Disconnect" : "Connect",
      icon: Power,
      disabled: toggling === toId(g.id),
      onClick: () => void handleToggle(g),
    },
    {
      label: "Delete",
      icon: Trash2,
      tone: "danger" as const,
      separatorBefore: true,
      onClick: () => setDeleteTarget(g),
    },
  ];

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Payment Gateways"
          description="Manage payment provider credentials used for auto-funding vendor balances."
          actions={
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" /> Add gateway
            </Button>
          }
        />

        {/* Stats */}
        {loading && !gateways.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total gateways"
              value={String(total)}
              icon={CreditCard}
              tone="neutral"
            />
            <StatCard
              label="Connected"
              value={String(connected)}
              icon={CreditCard}
              tone="success"
              meta={`${total - connected} disconnected`}
            />
            <StatCard
              label="Transfer-capable"
              value={String(transferCapable)}
              icon={ArrowUpRight}
              tone={transferCapable > 0 ? "success" : "neutral"}
              meta="Support auto-fund payouts"
            />
          </div>
        )}

        {/* Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <SkeletonRows count={4} />
          ) : gateways.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payment gateways"
              description="Add a gateway to enable automatic vendor top-ups."
              action={
                <Button size="sm" onClick={openCreate}>
                  <Plus className="w-3.5 h-3.5" /> Add gateway
                </Button>
              }
            />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {[
                        "Gateway",
                        "Balance",
                        "Transfers",
                        "Connection",
                        "Actions",
                      ].map((h, i) => (
                        <th
                          key={h}
                          className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap ${
                            i === 4
                              ? "text-center"
                              : i === 1
                                ? "text-right"
                                : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {slice.map((g) => (
                      <tr
                        key={g.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openView(g)}
                            className="flex items-center gap-2.5 text-left"
                          >
                            <div className="w-7 h-7 bg-[#111827]/10 text-[#111827] rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                              {g.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium text-slate-900 text-xs block hover:underline">
                                {g.name}
                              </span>
                              {g.code && (
                                <span className="text-xs font-mono text-slate-400">
                                  {g.code}
                                </span>
                              )}
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 text-right tabular-nums">
                          {fmt(g.balance)}
                        </td>
                        <td className="px-4 py-3">
                          <TransferBadge
                            supported={gatewaySupportsTransfer(g.name)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={g.connection ? "active" : "inactive"}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ActionMenu items={menuItems(g)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-100">
                {slice.map((g) => (
                  <div
                    key={g.id}
                    className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => openView(g)}
                      className="flex-1 min-w-0 flex items-start gap-3 text-left"
                    >
                      <div className="w-9 h-9 bg-[#111827]/10 text-[#111827] rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                        {g.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-900 text-sm">
                            {g.name}
                          </span>
                          {g.code && (
                            <span className="text-xs font-mono text-slate-400">
                              {g.code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <StatusBadge
                            status={g.connection ? "active" : "inactive"}
                          />
                          <TransferBadge
                            supported={gatewaySupportsTransfer(g.name)}
                          />
                          <span className="text-xs text-slate-500 tabular-nums">
                            {fmt(g.balance)}
                          </span>
                        </div>
                      </div>
                    </button>
                    <ActionMenu items={menuItems(g)} />
                  </div>
                ))}
              </div>

              <Pagination
                page={page}
                last={lastPage}
                total={total}
                from={from}
                to={to}
                onPage={setPageQuery}
              />
            </>
          )}
        </Card>
      </div>

      {deleteTarget && (
        <DeleteConfirm
          gateway={deleteTarget}
          onConfirm={() => void handleDelete()}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </>
  );
};

export default GatewayPage;
