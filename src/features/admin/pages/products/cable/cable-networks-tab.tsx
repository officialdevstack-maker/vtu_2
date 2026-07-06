import { useEffect, useState } from "react";
import {
  Cable,
  Plus,
  MoreVertical,
  Pencil,
  Power,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  Button,
  StatusBadge,
  EmptyState,
  SkeletonLine,
  inputCls,
} from "../../../../user/components/shared-ui";
import { Toolbar } from "../airtime-data/shared";
import { networkTypeService, type NetworkType, type NetworkTypePayload } from "./service";

// ─── Form modal ───────────────────────────────────────────────────────────────

type CableNetworkForm = { name: string; active: boolean };

const emptyForm = (): CableNetworkForm => ({ name: "", active: true });

function NetworkFormModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: CableNetworkForm;
  onSave: (payload: NetworkTypePayload) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<CableNetworkForm>(initial);
  const isEdit = Boolean(initial.name);
  const valid = form.name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-lg">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            {isEdit ? "Edit network" : "Add network"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Network name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. dstv, gotv, startime"
              className={inputCls}
            />
          </div>

          <div className="flex items-center justify-between border border-slate-200/70 rounded-xl px-3 py-2.5">
            <span className="text-sm text-slate-700">Active</span>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 accent-[#111827]"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button
              fullWidth
              disabled={!valid || saving}
              loading={saving}
              onClick={() => onSave({ name: form.name, service_type: "cable", active: form.active })}
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
  network: NetworkType;
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
            This permanently removes <strong>{network.name}</strong> and cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth disabled={deleting} loading={deleting} onClick={onConfirm}>
            Delete network
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Cable networks tab ───────────────────────────────────────────────────────

type ModalState =
  | { kind: "add" }
  | { kind: "edit"; network: NetworkType }
  | { kind: "delete"; network: NetworkType }
  | null;

export function CableNetworksTab() {
  const [networks, setNetworks] = useState<NetworkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const toId = (value: string | number) => String(value);

  useEffect(() => {
    networkTypeService
      .getAll()
      .then((all) => setNetworks(all.filter((t) => t.service_type === "cable")))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (payload: NetworkTypePayload) => {
    setSaving(true);
    try {
      const created = await networkTypeService.create(payload);
      setNetworks((prev) => [...prev, created]);
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (payload: NetworkTypePayload) => {
    if (modal?.kind !== "edit") return;
    setSaving(true);
    try {
      const updated = await networkTypeService.update(toId(modal.network.id), payload);
      setNetworks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (modal?.kind !== "delete") return;
    setSaving(true);
    try {
      await networkTypeService.remove(toId(modal.network.id));
      setNetworks((prev) => prev.filter((t) => t.id !== modal.network.id));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (network: NetworkType) => {
    setToggling(toId(network.id));
    setOpenMenuId(null);
    try {
      const updated = await networkTypeService.toggleStatus(network);
      setNetworks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } finally {
      setToggling(null);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <Toolbar>
          <div className="flex-1" />
          <Button size="sm" onClick={() => setModal({ kind: "add" })}>
            <Plus className="w-3.5 h-3.5" />
            Add network
          </Button>
        </Toolbar>

        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonLine className="h-7 w-7 rounded-full" />
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-3 flex-1" />
                <SkeletonLine className="h-5 w-14 rounded-md" />
              </div>
            ))}
          </div>
        ) : networks.length === 0 ? (
          <EmptyState
            icon={Cable}
            title="No cable networks configured"
            description="Add DStv, GOtv, Startimes, or any other cable provider you support."
            action={
              <Button size="sm" onClick={() => setModal({ kind: "add" })}>
                <Plus className="w-3.5 h-3.5" /> Add network
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Network", "Status", "Actions"].map((h, i) => (
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
                {networks.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-[#111827]/10 text-[#111827] rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                          {n.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 text-xs uppercase">{n.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={n.active ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex justify-center">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === toId(n.id) ? null : toId(n.id))}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openMenuId === toId(n.id) && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
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
                                disabled={toggling === toId(n.id)}
                                onClick={() => handleToggle(n)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                <Power className="w-3.5 h-3.5" />
                                {n.active ? "Deactivate" : "Activate"}
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

      {modal?.kind === "add" && (
        <NetworkFormModal initial={emptyForm()} onSave={handleAdd} onClose={() => setModal(null)} saving={saving} />
      )}

      {modal?.kind === "edit" && (
        <NetworkFormModal
          initial={{ name: modal.network.name, active: modal.network.active }}
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
