import { useEffect, useState } from "react";
import { Plus, MoreVertical, Pencil, Power, Trash2, X, AlertTriangle, Users } from "lucide-react";
import {
  Card,
  Button,
  StatusBadge,
  EmptyState,
  SkeletonLine,
  inputCls,
  selectCls,
} from "../../../user/components/shared-ui";
import { payeeService, type Payee, type PayeePayload } from "./service";
import { ErrorBanner, extractErrorMessage } from "./shared";

const fmt = (v: string | number) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return `₦${(Number.isFinite(n) ? n : 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
};

const emptyForm = (): PayeePayload => ({
  name: "",
  type: "staff",
  bank_name: "",
  account_number: "",
  account_name: "",
  payout_type: "fixed",
  payout_value: 0,
  frequency: "monthly",
  active: true,
  notes: "",
});

function PayeeFormModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: PayeePayload;
  onSave: (payload: PayeePayload) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<PayeePayload>(initial);
  const set = <K extends keyof PayeePayload>(key: K, value: PayeePayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isEdit = Boolean(initial.name);
  const valid = form.name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg max-h-[92vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            {isEdit ? "Edit payee" : "Add payee"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Name</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Chidi Okoro"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value as PayeePayload["type"])}
                className={selectCls}
              >
                <option value="staff">Staff</option>
                <option value="co_owner">Co-owner</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => set("frequency", e.target.value as PayeePayload["frequency"])}
                className={selectCls}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Payout type</label>
              <select
                value={form.payout_type}
                onChange={(e) => set("payout_type", e.target.value as PayeePayload["payout_type"])}
                className={selectCls}
              >
                <option value="fixed">Fixed (₦)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {form.payout_type === "percentage" ? "Value (%)" : "Value (₦)"}
              </label>
              <input
                type="number"
                min={0}
                value={form.payout_value}
                onChange={(e) => set("payout_value", Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Bank name</label>
            <input
              value={form.bank_name ?? ""}
              onChange={(e) => set("bank_name", e.target.value)}
              placeholder="e.g. GTBank"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Account number</label>
              <input
                value={form.account_number ?? ""}
                onChange={(e) => set("account_number", e.target.value)}
                inputMode="numeric"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Account name</label>
              <input
                value={form.account_name ?? ""}
                onChange={(e) => set("account_name", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              className={`${inputCls} min-h-16 resize-none`}
              placeholder="Optional"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button fullWidth disabled={!valid || saving} loading={saving} onClick={() => onSave(form)}>
              {isEdit ? "Save changes" : "Add payee"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({
  payee,
  onConfirm,
  onClose,
  deleting,
}: {
  payee: Payee;
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
            This permanently removes <strong>{payee.name}</strong> from the payout roster.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth disabled={deleting} loading={deleting} onClick={onConfirm}>
            Remove payee
          </Button>
        </div>
      </div>
    </div>
  );
}

type ModalState =
  | { kind: "add" }
  | { kind: "edit"; payee: Payee }
  | { kind: "delete"; payee: Payee }
  | null;

export function PaymentTab() {
  const [payees, setPayees] = useState<Payee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    payeeService
      .getAll()
      .then(setPayees)
      .catch((err) => setLoadError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (payload: PayeePayload) => {
    setSaving(true);
    try {
      const created = await payeeService.create(payload);
      setPayees((prev) => [...prev, created]);
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (payload: PayeePayload) => {
    if (modal?.kind !== "edit") return;
    setSaving(true);
    try {
      const updated = await payeeService.update(modal.payee.id, payload);
      setPayees((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (modal?.kind !== "delete") return;
    setSaving(true);
    try {
      await payeeService.remove(modal.payee.id);
      setPayees((prev) => prev.filter((p) => p.id !== modal.payee.id));
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (payee: Payee) => {
    setOpenMenuId(null);
    const updated = await payeeService.update(payee.id, { active: !payee.active });
    setPayees((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-lg border border-[#111827]/15 bg-[#111827]/10 px-3.5 py-2.5 text-xs text-[#111827]">
        <Users className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Who gets paid, how much, and how often — a roster for your own
          record-keeping. This does not move money automatically; use it to
          track who's owed what, then pay manually via your bank.
        </span>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-slate-900">Payout roster</h3>
          <Button size="sm" onClick={() => setModal({ kind: "add" })}>
            <Plus className="w-3.5 h-3.5" /> Add payee
          </Button>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <SkeletonLine key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : loadError ? (
          <div className="p-4">
            <ErrorBanner message={loadError} />
          </div>
        ) : payees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No payees yet"
            description="Add staff or co-owners to track who gets paid, how much, and how often."
            action={
              <Button size="sm" onClick={() => setModal({ kind: "add" })}>
                <Plus className="w-3.5 h-3.5" /> Add payee
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Name", "Type", "Payout", "Frequency", "Status", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-xs font-medium text-slate-500 whitespace-nowrap ${i === 5 ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payees.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 text-xs">{p.name}</p>
                      {p.account_number && (
                        <p className="text-xs text-slate-400">
                          {p.bank_name} · {p.account_number}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 capitalize">
                      {p.type.replace("_", "-")}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {p.payout_type === "percentage" ? `${p.payout_value}%` : fmt(p.payout_value)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 capitalize">{p.frequency}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.active ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative flex justify-center">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {openMenuId === p.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                            <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                              <button
                                onClick={() => {
                                  setModal({ kind: "edit", payee: p });
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => void handleToggleActive(p)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 transition-colors"
                              >
                                <Power className="w-3.5 h-3.5" /> {p.active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => {
                                  setModal({ kind: "delete", payee: p });
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove
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
        <PayeeFormModal initial={emptyForm()} onSave={handleAdd} onClose={() => setModal(null)} saving={saving} />
      )}
      {modal?.kind === "edit" && (
        <PayeeFormModal
          initial={{
            name: modal.payee.name,
            type: modal.payee.type,
            bank_name: modal.payee.bank_name ?? "",
            account_number: modal.payee.account_number ?? "",
            account_name: modal.payee.account_name ?? "",
            payout_type: modal.payee.payout_type,
            payout_value: Number(modal.payee.payout_value),
            frequency: modal.payee.frequency,
            active: modal.payee.active,
            notes: modal.payee.notes ?? "",
          }}
          onSave={handleEdit}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
      {modal?.kind === "delete" && (
        <DeleteConfirm
          payee={modal.payee}
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
          deleting={saving}
        />
      )}
    </div>
  );
}
