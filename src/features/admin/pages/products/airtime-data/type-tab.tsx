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
  networkTypeService,
  type NetworkType,
  type NetworkTypePayload,
} from "./service";

// ─── Form modal ───────────────────────────────────────────────────────────────

const emptyForm = (): NetworkTypePayload => ({
  name: "",
  service_type: "airtime",
  active: true,
});

function TypeFormModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: NetworkTypePayload;
  onSave: (payload: NetworkTypePayload) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<NetworkTypePayload>(initial);
  const set = (k: keyof NetworkTypePayload, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const isEdit = Boolean(initial.name);
  const valid = form.name.trim() && form.service_type;

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
              Service
            </label>
            <select
              value={form.service_type}
              onChange={(e) => set("service_type", e.target.value)}
              className={inputCls}
            >
              <option value="airtime">Airtime</option>
              <option value="data">Data</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Active
            </label>
            <select
              value={form.active ? "true" : "false"}
              onChange={(e) => set("active", e.target.value === "true")}
              className={inputCls}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
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
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const toId = (value: string | number) => String(value);

  useEffect(() => {
    networkTypeService
      .getAll()
      .then(setTypes)
      .finally(() => setLoading(false));
  }, []);

  const filtered = types
    .filter((t) => t.service_type === "airtime" || t.service_type === "data")
    .filter((t) => !serviceFilter || t.service_type === serviceFilter);

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
      const updated = await networkTypeService.update(
        toId(modal.type.id),
        payload,
      );
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
      await networkTypeService.remove(toId(modal.type.id));
      setTypes((prev) => prev.filter((t) => t.id !== modal.type.id));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (type: NetworkType) => {
    setToggling(toId(type.id));
    setOpenMenuId(null);
    try {
      const updated = await networkTypeService.toggleStatus(type);
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
            placeholder="All services"
            options={[
              { value: "airtime", label: "Airtime" },
              { value: "data", label: "Data" },
            ]}
            value={serviceFilter}
            onChange={setServiceFilter}
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
              serviceFilter
                ? "No types for this service"
                : "No service types configured"
            }
            description={
              serviceFilter
                ? "Try a different service or add a type for this one."
                : "Types define how a service is sold — e.g. VTU, SME, CG, or Gift."
            }
            action={
              !serviceFilter ? (
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
                  {[
                    "Type name",
                    "Service",
                    "Status",
                    "Actions",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap ${i === 3 ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
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
                    <td className="px-4 py-3 text-xs text-slate-500 capitalize">
                      {t.service_type}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.active ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex justify-center">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === toId(t.id) ? null : toId(t.id),
                            )
                          }
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {openMenuId === toId(t.id) && (
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
                                disabled={toggling === toId(t.id)}
                                onClick={() => handleToggle(t)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                <Power className="w-3.5 h-3.5" />
                                {t.active ? "Deactivate" : "Activate"}
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
          initial={emptyForm()}
          onSave={handleAdd}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.kind === "edit" && (
        <TypeFormModal
          initial={{
            name: modal.type.name,
            service_type: modal.type.service_type,
            active: modal.type.active,
          }}
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
