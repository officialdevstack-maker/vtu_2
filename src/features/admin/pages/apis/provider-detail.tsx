import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Eye,
  EyeOff,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  StatusBadge,
  inputCls,
} from "../../../user/components/shared-ui";
import {
  providerService,
  type Provider,
  type ProviderPayload,
} from "./providerService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBalance = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(v);
};

const toForm = (p: Provider): ProviderPayload => ({
  name: p.name ?? "",
  code: p.code ?? "",
  username: p.username ?? "",
  password: p.password ?? "",
  sub_category: p.sub_category ?? "",
  connection: p.connection ?? false,
});

// ─── Edit form modal ──────────────────────────────────────────────────────────

function EditModal({
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

  const valid = form.name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-lg">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">Edit provider</h3>
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
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-lg p-4">
        <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">
            This permanently removes <strong>{name}</strong> and cannot be
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
            Delete provider
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail page ──────────────────────────────────────────────────────────────

const ProviderDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [provider, setProvider] = useState<Provider | null>(
    (location.state as { provider?: Provider } | null)?.provider ?? null,
  );

  const [showPw, setShowPw] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const back = () => navigate("/admin/apis/provider");

  const handleSave = async (payload: ProviderPayload) => {
    if (!provider || !id) return;
    setSaving(true);
    try {
      const updated = await providerService.update(id, payload);
      setProvider(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await providerService.remove(id);
      navigate("/admin/apis/provider");
    } finally {
      setDeleting(false);
    }
  };

  if (!provider) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Provider"
          actions={
            <Button variant="secondary" size="sm" onClick={back}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          }
        />
        <Card className="p-8 text-center text-sm text-slate-500">
          Provider not found.{" "}
          <button onClick={back} className="text-indigo-600 underline">
            Go back
          </button>
        </Card>
      </div>
    );
  }

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-slate-400 w-32 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-xs text-slate-700 flex-1">{value}</span>
    </div>
  );

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title={provider.name}
          description={provider.sub_category ?? undefined}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
              <Button size="sm" onClick={() => setEditing(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button variant="secondary" size="sm" onClick={back}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
            </div>
          }
        />

        <Card className="divide-y divide-gray-50">
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Details
            </p>
          </div>

          <div className="px-5">
            {row("Code", provider.code ?? "—")}
            {row("Sub category", provider.sub_category ?? "—")}
            {row("Balance", formatBalance(provider.balance))}
            {row(
              "Connection",
              <StatusBadge
                status={provider.connection ? "active" : "inactive"}
              />,
            )}
          </div>

          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Credentials
            </p>
          </div>

          <div className="px-5">
            {row("Username", provider.username || "—")}
            {row(
              "Password",
              <span className="flex items-center gap-2">
                <span className="font-mono">
                  {showPw
                    ? provider.password || "—"
                    : provider.password
                      ? "••••••••"
                      : "—"}
                </span>
                {provider.password && (
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </span>,
            )}
          </div>

          {(provider.created_at || provider.updated_at) && (
            <>
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Timestamps
                </p>
              </div>
              <div className="px-5">
                {provider.created_at &&
                  row(
                    "Created",
                    new Date(provider.created_at).toLocaleString(),
                  )}
                {provider.updated_at &&
                  row(
                    "Updated",
                    new Date(provider.updated_at).toLocaleString(),
                  )}
              </div>
            </>
          )}
        </Card>
      </div>

      {editing && (
        <EditModal
          initial={toForm(provider)}
          onSave={(p) => void handleSave(p)}
          onClose={() => setEditing(false)}
          saving={saving}
        />
      )}

      {confirmDelete && (
        <DeleteConfirm
          name={provider.name}
          onConfirm={() => void handleDelete()}
          onClose={() => setConfirmDelete(false)}
          deleting={deleting}
        />
      )}
    </>
  );
};

export default ProviderDetailPage;
