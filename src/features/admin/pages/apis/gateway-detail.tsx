import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Eye,
  EyeOff,
  AlertTriangle,
  Zap,
  ZapOff,
  Power,
  CreditCard,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  StatusBadge,
  SkeletonLine,
  CopyButton,
} from "../../../user/components/shared-ui";
import {
  gatewayService,
  gatewaySupportsTransfer,
  type Gateway,
} from "./gatewayService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(v);
};

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl p-4">
        <div className="flex gap-2.5 bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">
            This permanently removes <strong>{name}</strong>. Any vendors
            configured to use this gateway for auto-funding will stop receiving
            transfers.
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
            Delete gateway
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail page ──────────────────────────────────────────────────────────────

const GatewayDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const [gateway, setGateway] = useState<Gateway | null>(
    (location.state as { gateway?: Gateway } | null)?.gateway ?? null,
  );
  const [loadingGateway, setLoadingGateway] = useState(!gateway);

  const [showPw, setShowPw] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingConn, setTogglingConn] = useState(false);
  const [refreshingToken, setRefreshingToken] = useState(false);

  const back = () => navigate("/admin/apis/gateway");

  const openEdit = () =>
    navigate(`/admin/apis/gateway/${id}/edit`, { state: { gateway } });

  // Always re-fetch, even when the row was passed through navigation state —
  // it may be stale (e.g. after saving on the edit page).
  useEffect(() => {
    if (!id) return;
    gatewayService
      .getById(id)
      .then(setGateway)
      .finally(() => setLoadingGateway(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await gatewayService.remove(id);
      navigate("/admin/apis/gateway");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleConnection = async () => {
    if (!gateway) return;
    setTogglingConn(true);
    try {
      const updated = await gatewayService.toggleConnection(gateway);
      setGateway(updated);
    } finally {
      setTogglingConn(false);
    }
  };

  const handleRefreshToken = async () => {
    if (!id) return;
    setRefreshingToken(true);
    try {
      await gatewayService.refreshToken(id);
      // Re-fetch rather than build the URL client-side — the backend owns
      // the exact webhook URL format (host + sub_category + identifier).
      const refreshed = await gatewayService.getById(id);
      setGateway(refreshed);
    } finally {
      setRefreshingToken(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingGateway) {
    return (
      <div className="space-y-5">
        <SkeletonLine className="h-7 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <SkeletonLine key={i} className="h-4 w-full" />
              ))}
            </Card>
          </div>
          <Card className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <SkeletonLine key={i} className="h-4 w-full" />
            ))}
          </Card>
        </div>
      </div>
    );
  }

  if (!gateway) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Gateway"
          actions={
            <Button variant="secondary" size="sm" onClick={back}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          }
        />
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500 mb-3">Gateway not found.</p>
          <Button variant="secondary" size="sm" onClick={back}>
            Go back
          </Button>
        </Card>
      </div>
    );
  }

  const supportsTransfer = gatewaySupportsTransfer(gateway.name);

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-xs text-slate-400 w-28 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-xs text-slate-800 flex-1 min-w-0">
        {value ?? "—"}
      </span>
    </div>
  );

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <PageHeader
          title={gateway.name}
          description={gateway.code ? `Code: ${gateway.code}` : undefined}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={back}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={togglingConn}
                loading={togglingConn}
                onClick={() => void handleToggleConnection()}
              >
                <Power className="w-3.5 h-3.5" />
                {gateway.connection ? "Disconnect" : "Connect"}
              </Button>
              <Button size="sm" onClick={openEdit}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left: Details + Credentials ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Details */}
            <Card>
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Gateway details
                </h2>
                <StatusBadge
                  status={gateway.connection ? "active" : "inactive"}
                />
              </div>
              <div className="px-5 py-1">
                {row("Name", gateway.name)}
                {row(
                  "Code",
                  gateway.code ? (
                    <span className="font-mono">{gateway.code}</span>
                  ) : null,
                )}
                {row("Balance", fmt(gateway.balance))}
                {row("Category", gateway.category ?? "payment")}
                {row(
                  "Webhook URL",
                  gateway.webhook ? (
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="font-mono truncate flex-1 min-w-0"
                        title={gateway.webhook}
                      >
                        {gateway.webhook}
                      </span>
                      <CopyButton value={gateway.webhook} label="webhook URL" />
                      <button
                        type="button"
                        onClick={() => void handleRefreshToken()}
                        disabled={refreshingToken}
                        title="Regenerate webhook token"
                        className="text-slate-400 hover:text-slate-600 disabled:opacity-50 shrink-0"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${refreshingToken ? "animate-spin" : ""}`}
                        />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleRefreshToken()}
                      disabled={refreshingToken}
                      className="inline-flex items-center gap-1.5 text-[#111827] hover:text-[#111827] font-medium disabled:opacity-50"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      {refreshingToken ? "Generating…" : "Generate webhook URL"}
                    </button>
                  ),
                )}
              </div>
              {(gateway.created_at || gateway.updated_at) && (
                <div className="px-5 py-1 border-t border-gray-50">
                  {gateway.created_at &&
                    row(
                      "Created",
                      new Date(gateway.created_at).toLocaleString(),
                    )}
                  {gateway.updated_at &&
                    row(
                      "Updated",
                      new Date(gateway.updated_at).toLocaleString(),
                    )}
                </div>
              )}
            </Card>

            {/* Credentials */}
            <Card>
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  API credentials
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Used by the system to authenticate with this gateway.
                </p>
              </div>
              <div className="px-5 py-1">
                {row(
                  "API key",
                  gateway.api_key ? (
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="font-mono break-all">
                        {gateway.api_key}
                      </span>
                      <CopyButton value={gateway.api_key} label="API key" />
                    </span>
                  ) : null,
                )}
                {row(
                  "Secret key",
                  gateway.secret_key ? (
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="font-mono break-all">
                        {showSecret ? gateway.secret_key : "••••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSecret((v) => !v)}
                        className="text-slate-400 hover:text-slate-600 shrink-0"
                      >
                        {showSecret ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <CopyButton
                        value={gateway.secret_key}
                        label="secret key"
                      />
                    </span>
                  ) : null,
                )}
                {row("Username / contract code", gateway.username || null)}
                {row(
                  "Password / token",
                  gateway.password ? (
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="font-mono">
                        {showPw ? gateway.password : "••••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="text-slate-400 hover:text-slate-600 shrink-0"
                      >
                        {showPw ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <CopyButton value={gateway.password} label="password" />
                    </span>
                  ) : null,
                )}
              </div>
            </Card>
          </div>

          {/* ── Right: Transfer capability ── */}
          <div className="space-y-5">
            <Card>
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Transfer capability
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Outbound payouts for vendor auto-funding
                </p>
              </div>
              <div className="p-5">
                <div
                  className={`rounded-xl p-4 flex flex-col items-center text-center gap-3 ${
                    supportsTransfer ? "bg-[#111827]/10" : "bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      supportsTransfer ? "bg-[#111827]/15" : "bg-slate-100"
                    }`}
                  >
                    {supportsTransfer ? (
                      <Zap className="w-5 h-5 text-[#111827]" />
                    ) : (
                      <ZapOff className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        supportsTransfer ? "text-[#111827]" : "text-slate-500"
                      }`}
                    >
                      {supportsTransfer
                        ? "Transfers supported"
                        : "Transfers unavailable"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {supportsTransfer
                        ? "This gateway can initiate bank transfers to fund vendor accounts automatically."
                        : "Outbound transfer API is not yet wired for this gateway. Use Flutterwave for auto-funding."}
                    </p>
                  </div>
                </div>

                {supportsTransfer && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Transfer API</span>
                      <span className="text-emerald-600 font-medium">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Gateway endpoint</span>
                      <span className="font-mono text-slate-600">
                        /v3/transfers
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Currency</span>
                      <span className="text-slate-600 font-medium">NGN</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick actions */}
            <Card className="p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Quick actions
              </p>
              <Button
                variant="secondary"
                fullWidth
                size="sm"
                onClick={openEdit}
              >
                <Pencil className="w-3.5 h-3.5" /> Edit credentials
              </Button>
              <Button
                variant="secondary"
                fullWidth
                size="sm"
                disabled={togglingConn}
                loading={togglingConn}
                onClick={() => void handleToggleConnection()}
              >
                <Power className="w-3.5 h-3.5" />
                {gateway.connection ? "Disconnect gateway" : "Connect gateway"}
              </Button>
              <Button
                variant="danger"
                fullWidth
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                Delete gateway
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <DeleteConfirm
          name={gateway.name}
          onConfirm={() => void handleDelete()}
          onClose={() => setConfirmDelete(false)}
          deleting={deleting}
        />
      )}
    </>
  );
};

export default GatewayDetailPage;
