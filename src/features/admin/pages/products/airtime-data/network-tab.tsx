import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Network as NetworkIcon,
  Plus,
  MoreVertical,
  Pencil,
  Power,
  Trash2,
  X,
  AlertTriangle,
  Search,
} from "lucide-react";
import {
  Card,
  Button,
  StatusBadge,
  EmptyState,
  SkeletonLine,
  inputCls,
  selectCls,
} from "../../../../user/components/shared-ui";
import { Toolbar } from "./shared";
import { networkService, type Network, type NetworkPayload } from "./service";

const MENU_WIDTH = 176; // w-44

// ─── Form modal (edit only — creating a network now uses its own page,
// see network-form.tsx at /admin/products/airtime-data/airtime/new) ─────────

function NetworkFormModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: NetworkPayload;
  onSave: (payload: NetworkPayload) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<NetworkPayload>(initial);
  const set = (k: keyof NetworkPayload, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const isEdit = Boolean((initial as Partial<Network>).name);
  const valid = form.name?.trim() && form.code?.trim();

  const a2cActive = Boolean(form.airtime_to_cash_active);
  const a2cMin = form.airtime_to_cash_min ?? 100;
  const a2cMax = form.airtime_to_cash_max ?? 50000;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-lg">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            {isEdit ? "Edit network" : "Add network"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Network name
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. MTN"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Code
            </label>
            <input
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              placeholder="e.g. MTN"
              maxLength={10}
              className={`${inputCls} font-mono uppercase`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={selectCls}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="border-t border-gray-100 pt-3.5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Airtime to Cash
              </label>
              <input
                type="checkbox"
                checked={a2cActive}
                onChange={(e) => setForm((f) => ({ ...f, airtime_to_cash_active: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 accent-[#111827]"
              />
            </div>

            {a2cActive && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Destination number
                  </label>
                  <input
                    value={form.airtime_to_cash_destination_number ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, airtime_to_cash_destination_number: e.target.value }))}
                    placeholder="Number customers transfer airtime to"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Min amount</label>
                    <input
                      type="number"
                      value={a2cMin}
                      onChange={(e) => setForm((f) => ({ ...f, airtime_to_cash_min: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Max amount</label>
                    <input
                      type="number"
                      value={a2cMax}
                      onChange={(e) => setForm((f) => ({ ...f, airtime_to_cash_max: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}
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
              {isEdit ? "Save changes" : "Add network"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  network,
  onConfirm,
  onClose,
  deleting,
}: {
  network: Network;
  onConfirm: () => void;
  onClose: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-lg p-4">
        <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">
            This permanently removes <strong>{network.name}</strong> and cannot
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
            Delete network
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Network tab ──────────────────────────────────────────────────────────────

type ModalState =
  | { kind: "edit"; network: Network }
  | { kind: "delete"; network: Network }
  | null;

export function NetworkTab() {
  const navigate = useNavigate();
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // The table scrolls horizontally (overflow-x-auto → overflow-y auto per the
  // CSS spec) and sits inside an overflow-hidden Card, both of which clip an
  // `absolute` menu. Fixed-position it from the trigger's own rect to escape
  // those overflow contexts (same fix the airtime tab uses).
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const toggleMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.right - MENU_WIDTH });
    setOpenMenuId(id);
  };

  useEffect(() => {
    networkService
      .getAll()
      .then(setNetworks)
      .finally(() => setLoading(false));
  }, []);

  const filtered = networks.filter((n) => {
    const q = search?.toLowerCase();
    return (
      !q ||
      n.name?.toLowerCase().includes(q)
      // n.code?.toLowerCase().includes(q) ||
      // n.provider?.toLowerCase().includes(q)
    );
  });

  const handleEdit = async (payload: NetworkPayload) => {
    if (modal?.kind !== "edit") return;
    setSaving(true);
    try {
      const updated = await networkService.update(modal.network.id, payload);
      setNetworks((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
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
      await networkService.remove(modal.network.id);
      setNetworks((prev) => prev.filter((n) => n.id !== modal.network.id));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (network: Network) => {
    setToggling(network.id);
    setOpenMenuId(null);
    try {
      const updated = await networkService.toggleStatus(network);
      setNetworks((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
    } finally {
      setToggling(null);
    }
  };

  return (
    <>
      <Card className="min-w-0 overflow-hidden">
        <Toolbar>
          <div className="relative min-w-0 flex-1 sm:min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search networks…"
              className={`${inputCls} pl-9 py-2`}
            />
          </div>
          <Button size="sm" onClick={() => navigate("/admin/products/airtime-data/airtime/new")}>
            <Plus className="w-3.5 h-3.5" />
            Add network
          </Button>
        </Toolbar>

        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonLine className="h-7 w-7 rounded-full" />
                <SkeletonLine className="h-3 w-28" />
                <SkeletonLine className="h-3 w-16" />
                <SkeletonLine className="h-3 flex-1" />
                <SkeletonLine className="h-5 w-14 rounded-md" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={NetworkIcon}
            title={
              search
                ? "No networks match your search"
                : "No networks configured"
            }
            description={
              search
                ? "Try a different name, code, or provider."
                : "Add a network to get started with airtime and data products."
            }
            action={
              !search ? (
                <Button size="sm" onClick={() => navigate("/admin/products/airtime-data/airtime/new")}>
                  <Plus className="w-3.5 h-3.5" /> Add network
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {[
                    "Network name",
                    "Status",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap ${i === 2 ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-[#111827]/10 text-[#111827] rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                          {n.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 text-xs">
                          {n.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={n.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex justify-center">
                        <button
                          onClick={(e) => toggleMenu(n.id, e)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openMenuId === n.id && menuPos && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div
                              className="fixed z-30 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                              style={{ top: menuPos.top, left: menuPos.left }}
                            >
                              <button
                                onClick={() => {
                                  setModal({ kind: "edit", network: n });
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                disabled={toggling === n.id}
                                onClick={() => handleToggle(n)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                <Power className="w-3.5 h-3.5" />
                                {n.status === "active"
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                              <button
                                onClick={() => {
                                  setModal({ kind: "delete", network: n });
                                  setOpenMenuId(null);
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal?.kind === "edit" && (
        <NetworkFormModal
          initial={{
            name: modal.network.name,
            code: modal.network.code,
            provider: modal.network.provider,
            status: modal.network.status,
            airtime_to_cash_destination_number: modal.network.airtime_to_cash_destination_number,
            airtime_to_cash_min: modal.network.airtime_to_cash_min,
            airtime_to_cash_max: modal.network.airtime_to_cash_max,
            airtime_to_cash_active: modal.network.airtime_to_cash_active,
          }}
          onSave={handleEdit}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.kind === "delete" && (
        <DeleteConfirm
          network={modal.network}
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
          deleting={saving}
        />
      )}
    </>
  );
}
