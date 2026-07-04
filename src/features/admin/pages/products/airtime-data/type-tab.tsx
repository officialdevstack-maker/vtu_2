import { useEffect, useState } from "react";
import {
  Layers,
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
import { Toolbar, SelectFilter } from "./shared";
import {
  networkService,
  networkTypeService,
  type Network,
  type NetworkType,
  type NetworkTypePayload,
} from "./service";

// ─── Form modal ───────────────────────────────────────────────────────────────

const emptyForm = (networks: Network[]): NetworkTypePayload => ({
  name: "",
  network_id: networks[0]?.id ?? "",
  description: "",
  status: "active",
});

function TypeFormModal({
  initial,
  networks,
  onSave,
  onClose,
  saving,
}: {
  initial: NetworkTypePayload;
  networks: Network[];
  onSave: (payload: NetworkTypePayload) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<NetworkTypePayload>(initial);
  const set = (k: keyof NetworkTypePayload, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const isEdit = Boolean(initial.name);
  const valid = form.name.trim() && form.network_id;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-lg">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            {isEdit ? "Edit type" : "Add type"}
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
              Type name
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. VTU, SME, CG, Gift"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Network
            </label>
            <select
              value={form.network_id}
              onChange={(e) => set("network_id", e.target.value)}
              className={inputCls}
            >
              {networks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Description
              <span className="text-slate-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description of this type"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={inputCls}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
              {isEdit ? "Save changes" : "Add type"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({
  type,
  onConfirm,
  onClose,
  deleting,
}: {
  type: NetworkType;
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
            This permanently removes <strong>{type.name}</strong> and cannot be
            undone.
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
            Delete type
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Type tab ─────────────────────────────────────────────────────────────────

type ModalState =
  | { kind: "add" }
  | { kind: "edit"; type: NetworkType }
  | { kind: "delete"; type: NetworkType }
  | null;

export function TypeTab() {
  const [types, setTypes] = useState<NetworkType[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkFilter, setNetworkFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([networkTypeService.getAll(), networkService.getAll()])
      .then(([t, n]) => {
        setTypes(t);
        setNetworks(n);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = types.filter(
    (t) => !networkFilter || t.network_id === networkFilter,
  );

  const networkName = (id: string) =>
    networks.find((n) => n.id === id)?.name ?? id;

  const handleAdd = async (payload: NetworkTypePayload) => {
    setSaving(true);
    try {
      const created = await networkTypeService.create(payload);
      setTypes((prev) => [...prev, created]);
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (payload: NetworkTypePayload) => {
    if (modal?.kind !== "edit") return;
    setSaving(true);
    try {
      const updated = await networkTypeService.update(modal.type.id, payload);
      setTypes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (modal?.kind !== "delete") return;
    setSaving(true);
    try {
      await networkTypeService.remove(modal.type.id);
      setTypes((prev) => prev.filter((t) => t.id !== modal.type.id));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (type: NetworkType) => {
    setToggling(type.id);
    setOpenMenuId(null);
    try {
      const updated = await networkTypeService.toggleStatus(type.id);
      setTypes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } finally {
      setToggling(null);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <Toolbar>
          <SelectFilter
            placeholder="All networks"
            options={networks.map((n) => ({ value: n.id, label: n.name }))}
            value={networkFilter}
            onChange={setNetworkFilter}
          />
          <div className="flex-1" />
          <Button size="sm" onClick={() => setModal({ kind: "add" })}>
            <Plus className="w-3.5 h-3.5" />
            Add type
          </Button>
        </Toolbar>

        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonLine className="h-7 w-7 rounded-full" />
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-3 w-16" />
                <SkeletonLine className="h-3 flex-1" />
                <SkeletonLine className="h-5 w-14 rounded-md" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={
              networkFilter
                ? "No types for this network"
                : "No network types configured"
            }
            description={
              networkFilter
                ? "Try a different network or add a type for this one."
                : "Types define how a network is sold — e.g. VTU, SME, CG, or Gift."
            }
            action={
              !networkFilter ? (
                <Button size="sm" onClick={() => setModal({ kind: "add" })}>
                  <Plus className="w-3.5 h-3.5" /> Add type
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Type name", "Network", "Description", "Status", "Actions"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap ${i === 4 ? "text-center" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                          {t.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 text-xs">
                          {t.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {networkName(t.network_id)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[220px] truncate">
                      {t.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex justify-center">
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === t.id ? null : t.id)
                          }
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openMenuId === t.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                              <button
                                onClick={() => {
                                  setModal({ kind: "edit", type: t });
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                disabled={toggling === t.id}
                                onClick={() => handleToggle(t)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                <Power className="w-3.5 h-3.5" />
                                {t.status === "active" ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => {
                                  setModal({ kind: "delete", type: t });
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
        <TypeFormModal
          initial={emptyForm(networks)}
          networks={networks}
          onSave={handleAdd}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.kind === "edit" && (
        <TypeFormModal
          initial={{
            name: modal.type.name,
            network_id: modal.type.network_id,
            description: modal.type.description,
            status: modal.type.status,
          }}
          networks={networks}
          onSave={handleEdit}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.kind === "delete" && (
        <DeleteConfirm
          type={modal.type}
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
          deleting={saving}
        />
      )}
    </>
  );
}
