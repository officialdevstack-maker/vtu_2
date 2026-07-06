import { useEffect, useState } from "react";
import {
  Banknote,
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
} from "../../../user/components/shared-ui";
import { Toolbar } from "../products/airtime-data/shared";
import {
  airtimeToCashNetworkService,
  type AirtimeToCashNetwork,
  type AirtimeToCashNetworkPayload,
} from "./service";

// ─── Form modal ───────────────────────────────────────────────────────────────

type NetworkForm = { network: string; destination_number: string; min: string; max: string; active: boolean };

const emptyForm = (): NetworkForm => ({ network: "", destination_number: "", min: "100", max: "50000", active: true });

function NetworkFormModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: NetworkForm;
  onSave: (payload: AirtimeToCashNetworkPayload) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<NetworkForm>(initial);
  const isEdit = Boolean(initial.network);
  const valid =
    form.network.trim().length > 0 &&
    form.destination_number.trim().length > 0 &&
    Number(form.min) >= 0 &&
    Number(form.max) > Number(form.min);

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
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Network</label>
            <input
              value={form.network}
              onChange={(e) => setForm((f) => ({ ...f, network: e.target.value.toLowerCase() }))}
              placeholder="e.g. mtn, glo, airtel, 9mobile"
              disabled={isEdit}
              className={`${inputCls} disabled:opacity-60`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Destination number</label>
            <input
              value={form.destination_number}
              onChange={(e) => setForm((f) => ({ ...f, destination_number: e.target.value }))}
              placeholder="Number customers transfer airtime to"
              className={`${inputCls} font-mono`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Min amount</label>
              <input
                type="number"
                value={form.min}
                onChange={(e) => setForm((f) => ({ ...f, min: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Max amount</label>
              <input
                type="number"
                value={form.max}
                onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))}
                className={inputCls}
              />
            </div>
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
              onClick={() =>
                onSave({
                  network: form.network,
                  destination_number: form.destination_number,
                  min: Number(form.min),
                  max: Number(form.max),
                  active: form.active,
                })
              }
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
  network: AirtimeToCashNetwork;
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
            This permanently removes <strong className="uppercase">{network.network}</strong> and cannot be undone.
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

// ─── Networks tab ──────────────────────────────────────────────────────────────

type ModalState =
  | { kind: "add" }
  | { kind: "edit"; network: AirtimeToCashNetwork }
  | { kind: "delete"; network: AirtimeToCashNetwork }
  | null;

const MENU_WIDTH = 176; // w-44

export function AirtimeToCashNetworksTab() {
  const [networks, setNetworks] = useState<AirtimeToCashNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const toId = (value: string | number) => String(value);

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
    airtimeToCashNetworkService.getAll().then(setNetworks).finally(() => setLoading(false));
  }, []);

  const handleAdd = async (payload: AirtimeToCashNetworkPayload) => {
    setSaving(true);
    try {
      const created = await airtimeToCashNetworkService.create(payload);
      setNetworks((prev) => [...prev, created]);
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (payload: AirtimeToCashNetworkPayload) => {
    if (modal?.kind !== "edit") return;
    setSaving(true);
    try {
      const updated = await airtimeToCashNetworkService.update(modal.network.id, payload);
      setNetworks((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (modal?.kind !== "delete") return;
    setSaving(true);
    try {
      await airtimeToCashNetworkService.remove(modal.network.id);
      setNetworks((prev) => prev.filter((n) => n.id !== modal.network.id));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (network: AirtimeToCashNetwork) => {
    setToggling(toId(network.id));
    setOpenMenuId(null);
    try {
      const updated = await airtimeToCashNetworkService.toggleStatus(network);
      setNetworks((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
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
            icon={Banknote}
            title="No networks configured"
            description="Add MTN, Glo, Airtel, or 9mobile with the number customers should transfer airtime to."
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
                  {["Network", "Destination number", "Range", "Status", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap ${i === 4 ? "text-center" : "text-left"}`}
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
                          {n.network[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 text-xs uppercase">{n.network}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{n.destination_number}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      ₦{Number(n.min).toLocaleString()} – ₦{Number(n.max).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={n.active ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex justify-center">
                        <button
                          onClick={(e) => toggleMenu(toId(n.id), e)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openMenuId === toId(n.id) && menuPos && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div
                              className="fixed z-20 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
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
          initial={{
            network: modal.network.network,
            destination_number: modal.network.destination_number,
            min: String(modal.network.min),
            max: String(modal.network.max),
            active: modal.network.active,
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
