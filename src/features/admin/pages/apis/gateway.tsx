import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  MoreVertical,
  Power,
  Trash2,
  X,
  AlertTriangle,
  CreditCard,
  Wallet,
  Zap,
  Eye,
  EyeOff,
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
  inputCls,
  selectCls,
} from "../../../user/components/shared-ui";
import {
  gatewayService,
  gatewaySupportsTransfer,
  type Gateway,
  type GatewayPayload,
} from "./gatewayService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toId = (v: string | number) => String(v);

const fmt = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(v);
};

// ─── Transfer support badge ───────────────────────────────────────────────────

function TransferBadge({ supported }: { supported: boolean }) {
  return supported ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
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
  page, last, total, from, to,
  onPage,
}: {
  page: number; last: number; total: number;
  from: number | null; to: number | null;
  onPage: (p: number) => void;
}) {
  if (last <= 1) return null;
  const pages: (number | "…")[] = [];
  if (last <= 7) {
    for (let i = 1; i <= last; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(last - 1, page + 1); i++) pages.push(i);
    if (page < last - 2) pages.push("…");
    pages.push(last);
  }
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 flex-wrap">
      <p className="text-xs text-slate-500 shrink-0">
        {from != null && to != null ? `Showing ${from}–${to} of ${total}` : `${total} total`}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-md text-slate-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`e-${i}`} className="px-1 text-xs text-slate-400">…</span>
            ) : (
              <button key={p} onClick={() => onPage(p)}
                className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors ${p === page ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-gray-100"}`}>
                {p}
              </button>
            )
          )}
        </div>
        <span className="sm:hidden text-xs text-slate-600 px-2">{page} / {last}</span>
        <button onClick={() => onPage(page + 1)} disabled={page === last}
          className="p-1.5 rounded-md text-slate-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Gateway form modal ───────────────────────────────────────────────────────

const emptyForm = (): GatewayPayload => ({
  name: "", code: "", username: "", password: "", connection: false,
});

const toForm = (g: Gateway): GatewayPayload => ({
  name: g.name ?? "",
  code: g.code ?? "",
  username: g.username ?? "",
  password: g.password ?? "",
  connection: g.connection ?? false,
});

function GatewayFormModal({
  initial, isEdit, onSave, onClose, saving,
}: {
  initial: GatewayPayload; isEdit: boolean;
  onSave: (p: GatewayPayload) => void;
  onClose: () => void; saving: boolean;
}) {
  const [form, setForm] = useState<GatewayPayload>(initial);
  const [showPw, setShowPw] = useState(false);
  const set = <K extends keyof GatewayPayload>(k: K, v: GatewayPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const valid = form.name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            {isEdit ? "Edit gateway" : "Add gateway"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Gateway name <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Flutterwave"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Code</label>
            <input
              value={form.code ?? ""}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="e.g. FLW"
              maxLength={10}
              className={`${inputCls} font-mono uppercase`}
            />
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-slate-500 mb-3">API credentials</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">API key / username</label>
                <input
                  value={form.username ?? ""}
                  onChange={(e) => set("username", e.target.value)}
                  placeholder="Public key or username"
                  className={inputCls}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Secret key / password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password ?? ""}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Secret key"
                    className={`${inputCls} pr-10`}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Connection</label>
            <select
              value={form.connection ? "true" : "false"}
              onChange={(e) => set("connection", e.target.value === "true")}
              className={selectCls}
            >
              <option value="true">Connected</option>
              <option value="false">Disconnected</option>
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
            <Button fullWidth disabled={!valid || saving} loading={saving} onClick={() => onSave(form)}>
              {isEdit ? "Save changes" : "Add gateway"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  gateway, onConfirm, onClose, deleting,
}: {
  gateway: Gateway; onConfirm: () => void; onClose: () => void; deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl p-4">
        <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">
            This permanently removes <strong>{gateway.name}</strong> and cannot be undone.
            Any vendors using this gateway for auto-funding will stop receiving transfers.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="danger" fullWidth disabled={deleting} loading={deleting} onClick={onConfirm}>
            Delete gateway
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Row menu ─────────────────────────────────────────────────────────────────

function RowMenu({
  gateway, open, toggling,
  onToggleOpen, onShow, onToggleConnection, onDelete,
}: {
  gateway: Gateway; open: boolean; toggling: boolean;
  onToggleOpen: () => void; onShow: () => void;
  onToggleConnection: () => void; onDelete: () => void;
}) {
  return (
    <div className="relative inline-flex">
      <button onClick={onToggleOpen}
        className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors">
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggleOpen} />
          <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-slate-200/70 rounded-xl shadow-md py-1">
            <button onClick={onShow}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors">
              <Eye className="w-3.5 h-3.5" /> Show
            </button>
            <button disabled={toggling} onClick={onToggleConnection}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
              <Power className="w-3.5 h-3.5" />
              {gateway.connection ? "Disconnect" : "Connect"}
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button onClick={onDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type ModalState =
  | { kind: "add" }
  | { kind: "edit"; gateway: Gateway }
  | { kind: "delete"; gateway: Gateway }
  | null;

const PAGE_SIZE = 10;

const GatewayPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await gatewayService.getAll();
      setGateways(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

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
  const transferCapable = gateways.filter((g) => gatewaySupportsTransfer(g.name)).length;

  // handlers
  const handleAdd = async (payload: GatewayPayload) => {
    setSaving(true);
    try {
      await gatewayService.create(payload);
      setModal(null);
      await load();
    } finally { setSaving(false); }
  };

  const handleEdit = async (payload: GatewayPayload) => {
    if (modal?.kind !== "edit") return;
    setSaving(true);
    try {
      const updated = await gatewayService.update(toId(modal.gateway.id), payload);
      setGateways((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (modal?.kind !== "delete") return;
    setSaving(true);
    try {
      await gatewayService.remove(toId(modal.gateway.id));
      setGateways((prev) => prev.filter((g) => g.id !== modal.gateway.id));
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleToggle = async (gateway: Gateway) => {
    const id = toId(gateway.id);
    setToggling(id);
    setOpenMenuId(null);
    try {
      const updated = await gatewayService.toggleConnection(gateway);
      setGateways((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    } finally { setToggling(null); }
  };

  const menuProps = (g: Gateway) => {
    const id = toId(g.id);
    return {
      gateway: g,
      open: openMenuId === id,
      toggling: toggling === id,
      onToggleOpen: () => setOpenMenuId((prev) => (prev === id ? null : id)),
      onShow: () => {
        setOpenMenuId(null);
        navigate(`/admin/apis/gateway/${id}`, { state: { gateway: g } });
      },
      onToggleConnection: () => void handleToggle(g),
      onDelete: () => {
        setModal({ kind: "delete", gateway: g });
        setOpenMenuId(null);
      },
    };
  };

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Payment Gateways"
          description="Manage payment provider credentials used for auto-funding vendor balances."
          actions={
            <Button size="sm" onClick={() => setModal({ kind: "add" })}>
              <Plus className="w-3.5 h-3.5" /> Add gateway
            </Button>
          }
        />

        {/* Stats */}
        {loading && !gateways.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
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
                <Button size="sm" onClick={() => setModal({ kind: "add" })}>
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
                      {["Gateway", "Balance", "Transfers", "Connection", "Actions"].map((h, i) => (
                        <th key={h}
                          className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap ${
                            i === 4 ? "text-center" : i === 1 ? "text-right" : "text-left"
                          }`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {slice.map((g) => (
                      <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                              {g.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium text-slate-900 text-xs block">{g.name}</span>
                              {g.code && (
                                <span className="text-xs font-mono text-slate-400">{g.code}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 text-right tabular-nums">
                          {fmt(g.balance)}
                        </td>
                        <td className="px-4 py-3">
                          <TransferBadge supported={gatewaySupportsTransfer(g.name)} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={g.connection ? "active" : "inactive"} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <RowMenu {...menuProps(g)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-100">
                {slice.map((g) => (
                  <div key={g.id} className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                      {g.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900 text-sm">{g.name}</span>
                        {g.code && <span className="text-xs font-mono text-slate-400">{g.code}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <StatusBadge status={g.connection ? "active" : "inactive"} />
                        <TransferBadge supported={gatewaySupportsTransfer(g.name)} />
                        <span className="text-xs text-slate-500 tabular-nums">{fmt(g.balance)}</span>
                      </div>
                    </div>
                    <RowMenu {...menuProps(g)} />
                  </div>
                ))}
              </div>

              <Pagination
                page={page} last={lastPage} total={total} from={from} to={to}
                onPage={setPageQuery}
              />
            </>
          )}
        </Card>
      </div>

      {modal?.kind === "add" && (
        <GatewayFormModal
          initial={emptyForm()}
          isEdit={false}
          onSave={(p) => void handleAdd(p)}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.kind === "edit" && (
        <GatewayFormModal
          initial={toForm(modal.gateway)}
          isEdit={true}
          onSave={(p) => void handleEdit(p)}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.kind === "delete" && (
        <DeleteConfirm
          gateway={modal.gateway}
          onConfirm={() => void handleDelete()}
          onClose={() => setModal(null)}
          deleting={saving}
        />
      )}
    </>
  );
};

export default GatewayPage;
