import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Plus,
  MoreVertical,
  Power,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  Plug,
  Wallet,
  Eye,
  EyeOff,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  StatCard,
  StatusBadge,
  EmptyState,
  SkeletonLine,
  SkeletonCard,
  inputCls,
} from "../../../user/components/shared-ui";
import {
  providerService,
  type Provider,
  type ProviderPayload,
  type PaginatedMeta,
} from "./providerService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toId = (v: string | number) => String(v);

const formatBalance = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(v);
};

// ─── Pagination bar ───────────────────────────────────────────────────────────

function Pagination({
  meta,
  onPage,
}: {
  meta: PaginatedMeta;
  onPage: (p: number) => void;
}) {
  const { current_page: page, last_page: last, total, from, to } = meta;
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

        {/* Page numbers — hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === "…" ? (
              <span
                key={`ellipsis-${i}`}
                className="px-1 text-xs text-slate-400"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors ${
                  p === page
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>

        {/* Mobile: just page counter */}
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

// ─── Token dialog ─────────────────────────────────────────────────────────────

function TokenDialog({
  token,
  onClose,
}: {
  token: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            New token generated
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-500">
            Copy this token now — it won't be shown again.
          </p>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
            <span className="text-xs font-mono text-slate-700 flex-1 break-all select-all">
              {token}
            </span>
            <button
              onClick={copy}
              className="shrink-0 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider form modal ──────────────────────────────────────────────────────

const emptyForm = (): ProviderPayload => ({
  name: "",
  code: "",
  username: "",
  password: "",
  sub_category: "",
  connection: false,
});

const toForm = (p: Provider): ProviderPayload => ({
  name: p.name ?? "",
  code: p.code ?? "",
  username: p.username ?? "",
  password: p.password ?? "",
  sub_category: p.sub_category ?? "",
  connection: p.connection ?? false,
});

function ProviderFormModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: ProviderPayload;
  onSave: (payload: ProviderPayload) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ProviderPayload>(initial);
  const [showPw, setShowPw] = useState(false);

  const set = <K extends keyof ProviderPayload>(k: K, v: ProviderPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const isEdit = Boolean(initial.name);
  const valid = form.name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            {isEdit ? "Edit provider" : "Add provider"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Provider name <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. VTpass"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Code
            </label>
            <input
              value={form.code ?? ""}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="e.g. VTP"
              maxLength={10}
              className={`${inputCls} font-mono uppercase`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Sub category
            </label>
            <input
              value={form.sub_category ?? ""}
              onChange={(e) => set("sub_category", e.target.value)}
              placeholder="e.g. airtime"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              API username
            </label>
            <input
              value={form.username ?? ""}
              onChange={(e) => set("username", e.target.value)}
              placeholder="API username or key"
              className={inputCls}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              API password / secret
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password ?? ""}
                onChange={(e) => set("password", e.target.value)}
                placeholder="API password or secret key"
                className={`${inputCls} pr-10`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Connection
            </label>
            <select
              value={form.connection ? "true" : "false"}
              onChange={(e) => set("connection", e.target.value === "true")}
              className={inputCls}
            >
              <option value="true">Connected</option>
              <option value="false">Disconnected</option>
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button
              fullWidth
              disabled={!valid || saving}
              loading={saving}
              onClick={() => onSave(form)}
            >
              {isEdit ? "Save changes" : "Add provider"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  provider,
  onConfirm,
  onClose,
  deleting,
}: {
  provider: Provider;
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
            This permanently removes <strong>{provider.name}</strong> and cannot
            be undone.
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
            Delete provider
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Row actions menu ─────────────────────────────────────────────────────────

function RowMenu({
  provider,
  open,
  toggling,
  refreshing,
  onToggleOpen,
  onShow,
  onToggleConnection,
  onRefreshToken,
  onDelete,
}: {
  provider: Provider;
  open: boolean;
  toggling: boolean;
  refreshing: boolean;
  onToggleOpen: () => void;
  onShow: () => void;
  onToggleConnection: () => void;
  onRefreshToken: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative inline-flex">
      <button
        onClick={onToggleOpen}
        className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggleOpen} />
          <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-slate-200/70 rounded-xl shadow-md py-1">
            <button
              onClick={onShow}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Show
            </button>

            <button
              disabled={toggling}
              onClick={onToggleConnection}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Power className="w-3.5 h-3.5" />
              {provider.connection ? "Disconnect" : "Connect"}
            </button>

            <button
              disabled={refreshing}
              onClick={onRefreshToken}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh token
            </button>

            <div className="border-t border-gray-100 my-1" />

            <button
              onClick={onDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
            >
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
  | { kind: "edit"; provider: Provider }
  | { kind: "delete"; provider: Provider }
  | null;

const ProviderPage = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);

  const PAGE_SIZE = 10;
  const load = async () => {
    setLoading(true);
    try {
      const data = await providerService.getAll();
      setProviders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totalProviders = providers.length;
  const lastPage = Math.max(1, Math.ceil(totalProviders / PAGE_SIZE));
  const page = Math.min(currentPage, lastPage);
  const paginatedProviders = providers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const pageMeta: PaginatedMeta = {
    current_page: page,
    last_page: lastPage,
    total: totalProviders,
    per_page: PAGE_SIZE,
    from: totalProviders === 0 ? null : (page - 1) * PAGE_SIZE + 1,
    to:
      totalProviders === 0 ? null : Math.min(page * PAGE_SIZE, totalProviders),
  };

  const connected = paginatedProviders.filter((p) => p.connection).length;
  const pageBalance = paginatedProviders.reduce((sum, p) => {
    const n = Number(p.balance);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const setPageQuery = (value: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(value));
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (page !== currentPage) {
      setPageQuery(page);
    }
  }, [page, currentPage]);

  const handleAdd = async (payload: ProviderPayload) => {
    setSaving(true);
    try {
      await providerService.create(payload);
      setModal(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (payload: ProviderPayload) => {
    if (modal?.kind !== "edit") return;
    setSaving(true);
    try {
      const updated = await providerService.update(
        toId(modal.provider.id),
        payload,
      );
      setProviders((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (modal?.kind !== "delete") return;
    setSaving(true);
    try {
      await providerService.remove(toId(modal.provider.id));
      setModal(null);
      setProviders((prev) => prev.filter((p) => p.id !== modal.provider.id));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (provider: Provider) => {
    const id = toId(provider.id);
    setToggling(id);
    setOpenMenuId(null);
    try {
      const updated = await providerService.toggleConnection(provider);
      setProviders((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
    } finally {
      setToggling(null);
    }
  };

  const handleRefreshToken = async (provider: Provider) => {
    const id = toId(provider.id);
    setRefreshingId(id);
    setOpenMenuId(null);
    try {
      const token = await providerService.refreshToken(id);
      setNewToken(token);
    } finally {
      setRefreshingId(null);
    }
  };

  const menuProps = (p: Provider) => {
    const id = toId(p.id);
    return {
      provider: p,
      open: openMenuId === id,
      toggling: toggling === id,
      refreshing: refreshingId === id,
      onToggleOpen: () => setOpenMenuId((prev) => (prev === id ? null : id)),
      onShow: () => {
        setOpenMenuId(null);
        navigate(`/admin/apis/provider/${id}`, { state: { provider: p } });
      },
      onToggleConnection: () => void handleToggle(p),
      onRefreshToken: () => void handleRefreshToken(p),
      onDelete: () => {
        setModal({ kind: "delete", provider: p });
        setOpenMenuId(null);
      },
    };
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Providers"
          description="Manage VTU API providers, credentials, and connection status."
          actions={
            <Button size="sm" onClick={() => setModal({ kind: "add" })}>
              <Plus className="w-3.5 h-3.5" />
              Add provider
            </Button>
          }
        />

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total providers"
              value={String(totalProviders)}
              icon={Plug}
              tone="neutral"
            />
            <StatCard
              label="Connected (this page)"
              value={String(connected)}
              icon={Plug}
              tone="success"
              meta={`${providers.length - connected} disconnected`}
            />
            <StatCard
              label="Balance (this page)"
              value={`₦${pageBalance.toLocaleString()}`}
              icon={Wallet}
              tone="neutral"
            />
          </div>
        )}

        {/* Table / card list */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonLine className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonLine className="h-3 w-32" />
                    <SkeletonLine className="h-2.5 w-20" />
                  </div>
                  <SkeletonLine className="h-5 w-16 rounded-md" />
                  <SkeletonLine className="h-5 w-5 rounded" />
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <EmptyState
              icon={Plug}
              title="No providers configured"
              description="Add an API provider to start routing transactions."
              action={
                <Button size="sm" onClick={() => setModal({ kind: "add" })}>
                  <Plus className="w-3.5 h-3.5" /> Add provider
                </Button>
              }
            />
          ) : (
            <>
              {/* ── Desktop table (md+) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Provider", "Balance", "Connection", "Actions"].map(
                        (h, i) => (
                          <th
                            key={h}
                            className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap ${
                              i === 3
                                ? "text-center"
                                : i === 1
                                  ? "text-right"
                                  : "text-left"
                            }`}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedProviders.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                              {p.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium text-slate-900 text-xs block">
                                {p.name}
                              </span>
                              {p.sub_category && (
                                <span className="text-xs text-slate-400 capitalize">
                                  {p.sub_category}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-600 text-right tabular-nums">
                          {formatBalance(p.balance)}
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge
                            status={p.connection ? "active" : "inactive"}
                          />
                        </td>

                        <td className="px-4 py-3 text-center">
                          <RowMenu {...menuProps(p)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards (< md) ── */}
              <div className="md:hidden divide-y divide-gray-100">
                {paginatedProviders.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                      {p.name[0]?.toUpperCase()}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900 text-sm">
                          {p.name}
                        </span>
                      </div>

                      {p.sub_category && (
                        <p className="text-xs text-slate-400 capitalize mt-0.5">
                          {p.sub_category}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <StatusBadge
                          status={p.connection ? "active" : "inactive"}
                        />
                        <span className="text-xs text-slate-500 tabular-nums">
                          {formatBalance(p.balance)}
                        </span>
                      </div>
                    </div>

                    {/* Menu */}
                    <RowMenu {...menuProps(p)} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <Pagination meta={pageMeta} onPage={setPageQuery} />
            </>
          )}
        </Card>
      </div>

      {/* Modals */}
      {modal?.kind === "add" && (
        <ProviderFormModal
          initial={emptyForm()}
          onSave={(p) => void handleAdd(p)}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.kind === "edit" && (
        <ProviderFormModal
          initial={toForm(modal.provider)}
          onSave={(p) => void handleEdit(p)}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.kind === "delete" && (
        <DeleteConfirm
          provider={modal.provider}
          onConfirm={() => void handleDelete()}
          onClose={() => setModal(null)}
          deleting={saving}
        />
      )}

      {newToken && (
        <TokenDialog token={newToken} onClose={() => setNewToken(null)} />
      )}
    </>
  );
};

export default ProviderPage;
