import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Network,
  AlertTriangle,
  X,
  Copy,
  Check,
  PauseCircle,
  PlayCircle,
  ShieldOff,
  HeartPulse,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  StatCard,
  StatusBadge,
  EmptyState,
  SkeletonRows,
  inputCls,
} from "../../../user/components/shared-ui";
import {
  childInstanceService,
  type ChildInstance,
  type ChildInstanceStatus,
  type RegistrationCode,
} from "./service";

const toId = (v: string | number) => String(v);

const MENU_WIDTH = 176; // w-44

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// A child instance that hasn't reported in over 15 minutes (3x the 5-minute
// cron cadence both sync commands run on) is worth flagging visually —
// could mean the child's cron stopped, or PARENT_SYNC_ENABLED got flipped
// off.
function isStale(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return true;
  return Date.now() - new Date(lastSeenAt).getTime() > 15 * 60 * 1000;
}

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (typeof data?.message === "string") return data.message;
  }
  return "Could not generate a code. Please try again.";
}

// ─── Generate code modal ──────────────────────────────────────────────────────
// Replaces a full "create affiliate" form — an admin only ever provides a
// name and gets a one-time code back. The child turns that into its own
// real slug/secret the first time it connects (php artisan
// parent-sync:register <code> on the child).

function GenerateCodeModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegistrationCode | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!name.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const code = await childInstanceService.generateCode(name.trim());
      setResult(code);
      onCreated();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    if (!result) return;
    void navigator.clipboard.writeText(result.registration_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            {result ? "Registration code generated" : "Add affiliate"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {result ? (
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-500">
              Give this code to whoever is setting up <strong>{result.name}</strong>. On the child app,
              they run:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <code className="text-xs text-slate-700 block break-all">
                php artisan parent-sync:register {result.registration_code}
              </code>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <span className="text-xs font-mono text-slate-700 flex-1 break-all select-all">
                {result.registration_code}
              </span>
              <button onClick={copyCode} className="shrink-0 text-slate-400 hover:text-[#111827] transition-colors">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-amber-600">
              Expires {new Date(result.expires_at).toLocaleString()} — the affiliate will show as
              "Pending" until it registers with this code.
            </p>
            <Button variant="secondary" fullWidth onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-3.5">
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Affiliate name <span className="text-red-400">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adex Maditel"
                className={inputCls}
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" fullWidth onClick={onClose}>
                Cancel
              </Button>
              <Button fullWidth disabled={!name.trim() || generating} loading={generating} onClick={() => void handleGenerate()}>
                Generate code
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteConfirm({
  name,
  onConfirm,
  onClose,
  deleting,
}: {
  name: string;
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
            This permanently removes <strong>{name}</strong> and its synced
            customers/transactions. This cannot be undone.
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
            Delete affiliate
          </Button>
        </div>
      </div>
    </div>
  );
}

// A per-instance breakdown beyond the four top-line StatCards — specifically
// the instances that need a human to look at them (stale check-in, paused,
// or revoked), so an admin doesn't have to scan the whole table to find
// them. Collapses to nothing when everything is healthy.
function HealthPanel({
  instances,
  onSelect,
}: {
  instances: ChildInstance[];
  onSelect: (instance: ChildInstance) => void;
}) {
  const attention = instances.filter(
    (i) => i.status === "revoked" || i.status === "paused" || (i.status === "active" && isStale(i.last_seen_at)),
  );

  if (attention.length === 0) {
    return (
      <Card className="px-5 py-4 flex items-center gap-2.5">
        <HeartPulse className="w-4 h-4 text-emerald-500 shrink-0" />
        <p className="text-xs text-slate-500">
          All connected affiliates are healthy — active and checking in normally.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
        <HeartPulse className="w-3.5 h-3.5 text-amber-500" />
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Needs attention ({attention.length})
        </h2>
      </div>
      <div className="divide-y divide-gray-50">
        {attention.map((instance) => {
          const stale = instance.status === "active" && isStale(instance.last_seen_at);
          const reason = instance.status === "revoked"
            ? "Revoked"
            : instance.status === "paused"
              ? "Paused"
              : "No check-in in 15+ minutes";
          return (
            <button
              key={instance.id}
              onClick={() => onSelect(instance)}
              className="w-full flex items-center justify-between gap-3 px-5 py-2.5 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">{instance.name}</p>
                <p className="text-[11px] text-slate-400">{reason}</p>
              </div>
              <StatusBadge
                status={
                  instance.status === "paused" ? "inactive" : instance.status === "revoked" ? "suspended" : "active"
                }
              />
              {stale && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function BulkActionBar({
  count,
  busy,
  onSetStatus,
  onClear,
}: {
  count: number;
  busy: boolean;
  onSetStatus: (status: ChildInstanceStatus) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#111827]/15 bg-[#111827]/10 px-4 py-2">
      <p className="text-xs font-medium text-[#111827]">
        {count} affiliate{count === 1 ? "" : "s"} selected
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => onSetStatus("paused")}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-50 transition-colors"
        >
          <PauseCircle className="w-3.5 h-3.5" /> Pause
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onSetStatus("active")}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-50 transition-colors"
        >
          <PlayCircle className="w-3.5 h-3.5" /> Resume
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Revoke ${count} affiliate${count === 1 ? "" : "s"}? Their sync credentials will stop being accepted.`)) {
              onSetStatus("revoked");
            }
          }}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-white disabled:opacity-50 transition-colors"
        >
          <ShieldOff className="w-3.5 h-3.5" /> Revoke
        </button>
        <div className="w-px h-4 bg-[#111827]/15 mx-1" />
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-[#111827] hover:text-[#111827] px-2"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default function AffiliatePage() {
  const navigate = useNavigate();
  const [instances, setInstances] = useState<ChildInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChildInstance | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = () => {
    setLoading(true);
    childInstanceService
      .getAll()
      .then(setInstances)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.right - MENU_WIDTH });
    setOpenMenuId(id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await childInstanceService.remove(toId(deleteTarget.id));
      setInstances((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const pendingCount = instances.filter((i) => i.status === "pending").length;
  const activeCount = instances.filter((i) => i.status === "active").length;
  const staleCount = instances.filter((i) => i.status === "active" && isStale(i.last_seen_at)).length;

  const allSelected = instances.length > 0 && instances.every((i) => selected.has(toId(i.id)));
  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(instances.map((i) => toId(i.id))));
  };
  const handleBulkStatus = async (status: ChildInstanceStatus) => {
    setBulkBusy(true);
    try {
      await childInstanceService.bulkUpdateStatus(Array.from(selected), status);
      setInstances((prev) =>
        prev.map((i) => (selected.has(toId(i.id)) ? { ...i, status } : i)),
      );
      setSelected(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Affiliates"
          description="Connected child platforms — view their synced customers/transactions and manage the connection."
          actions={
            <Button size="sm" className="w-full sm:w-auto" onClick={() => setShowGenerateModal(true)}>
              <Plus className="w-3.5 h-3.5" />
              Add affiliate
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard label="Total affiliates" value={String(instances.length)} icon={Network} tone="neutral" />
          <StatCard label="Active" value={String(activeCount)} icon={Network} tone="success" />
          <StatCard label="Pending connection" value={String(pendingCount)} icon={Network} tone={pendingCount > 0 ? "warning" : "neutral"} />
          <StatCard
            label="Stale (no check-in 15m+)"
            value={String(staleCount)}
            icon={AlertTriangle}
            tone={staleCount > 0 ? "danger" : "neutral"}
          />
        </div>

        {!loading && instances.length > 0 && (
          <HealthPanel
            instances={instances}
            onSelect={(instance) => navigate(`/admin/affiliates/${toId(instance.id)}`, { state: { instance } })}
          />
        )}

        <Card className="overflow-hidden">
          {loading ? (
            <SkeletonRows count={4} />
          ) : instances.length === 0 ? (
            <EmptyState
              icon={Network}
              title="No affiliates connected"
              description="Add an affiliate to generate a one-time registration code for it."
              action={
                <Button size="sm" onClick={() => setShowGenerateModal(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add affiliate
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto overscroll-x-contain">
              {selected.size > 0 && (
                <BulkActionBar
                  count={selected.size}
                  busy={bulkBusy}
                  onSetStatus={(status) => void handleBulkStatus(status)}
                  onClear={() => setSelected(new Set())}
                />
              )}
              <table className="min-w-[760px] w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="w-10 px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-[#111827] focus:ring-[#111827]"
                        aria-label="Select all affiliates"
                      />
                    </th>
                    {["Name", "Slug", "Status", "Last check-in", "Actions"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap ${
                          i === 4 ? "text-center" : "text-left"
                        } ${i === 0 ? "w-[24%]" : i === 1 ? "w-[22%]" : i === 4 ? "w-24" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {instances.map((instance) => {
                    const id = toId(instance.id);
                    const stale = instance.status === "active" && isStale(instance.last_seen_at);
                    return (
                      <tr key={id} className={`hover:bg-gray-50 transition-colors ${selected.has(id) ? "bg-[#111827]/5" : ""}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(id)}
                            onChange={() => toggleRow(id)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-[#111827] focus:ring-[#111827]"
                            aria-label={`Select ${instance.name}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="block truncate text-xs font-medium text-slate-900" title={instance.name}>
                            {instance.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">
                          <span className="block truncate" title={instance.slug}>{instance.slug}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
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
                            {stale && (
                              <span title="No check-in in 15+ minutes">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {timeAgo(instance.last_seen_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="relative inline-flex">
                            <button
                              onClick={(e) => toggleMenu(id, e)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {openMenuId === id && menuPos && (
                              <>
                                <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)} />
                                <div
                                  className="fixed z-30 w-44 bg-white border border-slate-200/70 rounded-xl shadow-md py-1"
                                  style={{ top: menuPos.top, left: menuPos.left }}
                                >
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      navigate(`/admin/affiliates/${id}`, { state: { instance } });
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> View
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      navigate(`/admin/affiliates/${id}/edit`, { state: { instance } });
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                                  >
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                  </button>
                                  <div className="border-t border-gray-100 my-1" />
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setDeleteTarget(instance);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {showGenerateModal && (
        <GenerateCodeModal onClose={() => { setShowGenerateModal(false); load(); }} onCreated={load} />
      )}

      {deleteTarget && (
        <DeleteConfirm
          name={deleteTarget.name}
          onConfirm={() => void handleDelete()}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </>
  );
}
