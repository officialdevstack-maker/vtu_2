import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Eye,
  EyeOff,
  AlertTriangle,
  Zap,
  ZapOff,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  KeyRound,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  StatusBadge,
  inputCls,
  selectCls,
  SkeletonLine,
  CopyButton,
} from "../../../user/components/shared-ui";
import {
  providerService,
  type Provider,
  type AutoFundPayload,
  type FundingRecord,
  type ProviderBank,
} from "./providerService";

// sub_category "simhost" is a grouping bucket (the actual vendor — SME Plug,
// Ogdams, vtpass… — is picked by NAME within it), not a single engine, so
// there's no one base URL it implies the way there is for adex/spurs/msorg.
// Per product decision, it's not shown here at all for that sub_category.
const isEngineType = (subCategory: string | null | undefined) =>
  (subCategory ?? "") !== "simhost";

// ADEX and the legacy provider aliases that map to the Adex class can sync
// remote data plans. Other vendors will still surface the backend's 422 if
// they do not implement syncPlans().
const supportsSyncPlans = (subCategory: string | null | undefined) => {
  const normalized = (subCategory ?? "").toLowerCase();
  return ["adex", "spurs", "msorg", "simhost"].includes(normalized);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === "") return "—";
  // Strip grouping commas — Number("4,495") is NaN otherwise.
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(v);
};

const toId = (v: string | number) => String(v);

const toAutoFundForm = (p: Provider) => ({
  auto_fund_enabled: p.auto_fund_enabled ?? false,
  auto_fund_threshold:
    p.auto_fund_threshold != null ? String(p.auto_fund_threshold) : "",
  auto_fund_amount:
    p.auto_fund_amount != null ? String(p.auto_fund_amount) : "",
  manual_balance: p.manual_balance != null ? String(p.manual_balance) : "",
  account_number: p.account_number ?? "",
  account_name: p.account_name ?? "",
  bank_code: p.bank_code ?? "",
  bank_name: p.bank_name ?? "",
  funding_provider_id:
    p.funding_provider_id != null ? String(p.funding_provider_id) : "",
});

type AutoFundForm = ReturnType<typeof toAutoFundForm>;

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

// ─── Funding status badge ─────────────────────────────────────────────────────

function FundingStatusBadge({ status }: { status: FundingRecord["status"] }) {
  if (status === "success")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Success
      </span>
    );
  if (status === "failed")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> Failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Pending
    </span>
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
  const [loadingProvider, setLoadingProvider] = useState(!provider);

  const [showPw, setShowPw] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // auto-fund
  const [autoFundForm, setAutoFundForm] = useState<AutoFundForm>({
    auto_fund_enabled: false,
    auto_fund_threshold: "",
    auto_fund_amount: "",
    manual_balance: "",
    account_number: "",
    account_name: "",
    bank_code: "",
    bank_name: "",
    funding_provider_id: "",
  });
  const [paymentProviders, setPaymentProviders] = useState<Provider[]>([]);
  const [banks, setBanks] = useState<ProviderBank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [savingAutoFund, setSavingAutoFund] = useState(false);
  const [autoFundSaved, setAutoFundSaved] = useState(false);

  // funding history
  const [history, setHistory] = useState<FundingRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // webhook token
  const [refreshingToken, setRefreshingToken] = useState(false);

  // vendor plan sync — only providers whose class implements syncPlans()
  // (currently Ogdams) actually do anything; others surface the backend's
  // "not supported" message via the same banner.
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const back = () => navigate("/admin/apis/provider");

  const setAF = <K extends keyof AutoFundForm>(k: K, v: AutoFundForm[K]) =>
    setAutoFundForm((f) => ({ ...f, [k]: v }));

  // fetch provider if not in state
  useEffect(() => {
    if (!id) return;
    if (!provider) {
      setLoadingProvider(true);
      providerService
        .getById(id)
        .then((p) => {
          setProvider(p);
          setAutoFundForm(toAutoFundForm(p));
        })
        .finally(() => setLoadingProvider(false));
    } else {
      setAutoFundForm(toAutoFundForm(provider));
    }
  }, [id]);

  useEffect(() => {
    providerService
      .getPaymentProviders()
      .then(setPaymentProviders)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const providerId = autoFundForm.funding_provider_id;

    if (!providerId) {
      setBanks([]);
      setLoadingBanks(false);
      return;
    }

    let isActive = true;
    setLoadingBanks(true);

    providerService
      .getBanksForProvider(providerId)
      .then((response) => {
        if (!isActive) return;
        setBanks(response);
        if (
          response.length > 0 &&
          !response.some((bank) => bank.code === autoFundForm.bank_code)
        ) {
          setAF("bank_code", "");
          setAF("bank_name", "");
        }
      })
      .catch(() => {
        if (!isActive) return;
        setBanks([]);
      })
      .finally(() => {
        if (isActive) setLoadingBanks(false);
      });

    return () => {
      isActive = false;
    };
  }, [autoFundForm.funding_provider_id]);

  useEffect(() => {
    if (!id) return;
    setLoadingHistory(true);
    providerService
      .getFundingHistory(id)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [id]);

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

  const handleSaveAutoFund = async () => {
    if (!id) return;
    setSavingAutoFund(true);
    try {
      const payload: AutoFundPayload = {
        auto_fund_enabled: autoFundForm.auto_fund_enabled,
        auto_fund_threshold: autoFundForm.auto_fund_threshold
          ? Number(autoFundForm.auto_fund_threshold)
          : null,
        auto_fund_amount: autoFundForm.auto_fund_amount
          ? Number(autoFundForm.auto_fund_amount)
          : null,
        manual_balance: autoFundForm.manual_balance
          ? Number(autoFundForm.manual_balance)
          : null,
        account_number: autoFundForm.account_number || null,
        account_name: autoFundForm.account_name || null,
        bank_code: autoFundForm.bank_code || null,
        bank_name: autoFundForm.bank_name || null,
        funding_provider_id: autoFundForm.funding_provider_id
          ? Number(autoFundForm.funding_provider_id)
          : null,
      };
      const updated = await providerService.updateAutoFund(id, payload);
      setProvider(updated);
      setAutoFundSaved(true);
      setTimeout(() => setAutoFundSaved(false), 3000);
    } finally {
      setSavingAutoFund(false);
    }
  };

  const handleRefreshToken = async () => {
    if (!id) return;
    setRefreshingToken(true);
    try {
      await providerService.refreshToken(id);
      // Re-fetch rather than build the URL client-side — the backend owns
      // the exact webhook URL format (host + sub_category + identifier).
      const refreshed = await providerService.getById(id);
      setProvider(refreshed);
    } finally {
      setRefreshingToken(false);
    }
  };

  const handleSyncPlans = async () => {
    if (!id) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const summary = await providerService.syncPlans(id);
      setSyncMessage({
        ok: true,
        text: `${summary.message ?? "Plans synced."} Synced: ${summary.created} new (as drafts), ${summary.updated} updated, ${summary.skipped} skipped.`,
      });
    } catch (err) {
      const text = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string } | undefined)?.message ??
          "Could not sync plans for this provider.")
        : "Could not sync plans for this provider.";
      setSyncMessage({ ok: false, text });
    } finally {
      setSyncing(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadingProvider) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <SkeletonLine className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <SkeletonLine key={i} className="h-4 w-full" />
              ))}
            </Card>
          </div>
          <Card className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <SkeletonLine key={i} className="h-4 w-full" />
            ))}
          </Card>
        </div>
      </div>
    );
  }

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
        <Card className="p-10 text-center">
          <p className="text-sm text-slate-500 mb-3">Provider not found.</p>
          <Button variant="secondary" size="sm" onClick={back}>
            Go back
          </Button>
        </Card>
      </div>
    );
  }

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

  const enabled = autoFundForm.auto_fund_enabled;

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <PageHeader
          title={provider.name}
          description={
            isEngineType(provider.sub_category)
              ? (provider.base_url ?? undefined)
              : undefined
          }
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={back}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
              {supportsSyncPlans(provider.sub_category) && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={syncing}
                  loading={syncing}
                  onClick={() => void handleSyncPlans()}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`}
                  />
                  Sync plans
                </Button>
              )}
              <Button
                size="sm"
                onClick={() =>
                  navigate(`/admin/apis/provider/${id}/edit`, {
                    state: { provider },
                  })
                }
              >
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

        {syncMessage && (
          <div
            className={`flex items-center gap-2 text-xs px-3.5 py-2.5 rounded-lg ${
              syncMessage.ok
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {syncMessage.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 shrink-0" />
            )}
            {syncMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left column: Details + History ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Details card */}
            <Card>
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Provider details
                </h2>
                <StatusBadge
                  status={provider.connection ? "active" : "inactive"}
                />
              </div>
              <div className="px-5 py-1">
                {isEngineType(provider.sub_category) &&
                  row(
                    "Base URL",
                    provider.base_url ? (
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="font-mono truncate flex-1 min-w-0"
                          title={provider.base_url}
                        >
                          {provider.base_url}
                        </span>
                        <CopyButton
                          value={provider.base_url}
                          label="base URL"
                        />
                      </span>
                    ) : null,
                  )}
                {row("Balance", fmt(provider.balance))}
                {row(
                  "Username",
                  provider.username ? (
                    <span className="flex items-center gap-2">
                      <span className="font-mono">{provider.username}</span>
                      <CopyButton value={provider.username} label="username" />
                    </span>
                  ) : null,
                )}
                {row(
                  "Password",
                  provider.password ? (
                    <span className="flex items-center gap-2">
                      <span className="font-mono">
                        {showPw ? provider.password : "••••••••"}
                      </span>
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
                      <CopyButton value={provider.password} label="password" />
                    </span>
                  ) : null,
                )}
                {row(
                  "Webhook URL",
                  provider.webhook ? (
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className="font-mono truncate flex-1 min-w-0"
                        title={provider.webhook}
                      >
                        {provider.webhook}
                      </span>
                      <CopyButton
                        value={provider.webhook}
                        label="webhook URL"
                      />
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
              {(provider.created_at || provider.updated_at) && (
                <div className="px-5 py-1 border-t border-gray-50">
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
              )}
            </Card>

            {/* Funding history */}
            <Card>
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Funding history
                </h2>
                {!loadingHistory && history.length > 0 && (
                  <span className="text-xs text-slate-400">
                    {history.length} records
                  </span>
                )}
              </div>

              {loadingHistory ? (
                <div className="p-5 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <SkeletonLine className="h-4 flex-1" />
                      <SkeletonLine className="h-4 w-20" />
                      <SkeletonLine className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <RefreshCw className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    No funding events yet.
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Auto-fund transfers will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {[
                          "Date",
                          "Amount",
                          "Balance before",
                          "Gateway",
                          "Status",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {history.map((r) => (
                        <tr
                          key={r.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {new Date(r.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800 tabular-nums whitespace-nowrap">
                            {fmt(r.amount)}
                          </td>
                          <td className="px-4 py-3 text-slate-500 tabular-nums whitespace-nowrap">
                            {fmt(r.balance_before)}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {r.payment_provider?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <FundingStatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* ── Right column: Auto-fund settings ── */}
          <div>
            <Card className="sticky top-5">
              {/* Card header with toggle */}
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Auto-funding
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Top up automatically when balance is low
                  </p>
                </div>
                {/* Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => setAF("auto_fund_enabled", !enabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    enabled ? "bg-[#111827]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                      enabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Status pill */}
                <div
                  className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                    enabled
                      ? "bg-[#111827]/10 text-[#111827]"
                      : "bg-gray-50 text-slate-400"
                  }`}
                >
                  {enabled ? (
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ZapOff className="w-3.5 h-3.5 shrink-0" />
                  )}
                  {enabled
                    ? "Auto-funding is active. Configure thresholds below."
                    : "Enable to configure automatic top-ups for this provider."}
                </div>

                {/* Thresholds */}
                <div
                  className={`space-y-3 transition-opacity ${enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Manual balance override (₦)
                      <span className="ml-1 font-normal text-slate-400">
                        — overrides live balance checks when set
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={autoFundForm.manual_balance}
                      onChange={(e) => setAF("manual_balance", e.target.value)}
                      placeholder="e.g. 25000"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Threshold (₦)
                      <span className="ml-1 font-normal text-slate-400">
                        — triggers top-up below this
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={autoFundForm.auto_fund_threshold}
                      onChange={(e) =>
                        setAF("auto_fund_threshold", e.target.value)
                      }
                      placeholder="e.g. 5000"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Top-up amount (₦)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={autoFundForm.auto_fund_amount}
                      onChange={(e) =>
                        setAF("auto_fund_amount", e.target.value)
                      }
                      placeholder="e.g. 50000"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Payment gateway
                    </label>
                    <select
                      value={autoFundForm.funding_provider_id}
                      onChange={(e) =>
                        setAF("funding_provider_id", e.target.value)
                      }
                      className={selectCls}
                    >
                      <option value="">Select gateway…</option>
                      {paymentProviders?.map((p) => (
                        <option key={p.id} value={toId(p.id)}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 pt-1">
                    <p className="text-xs font-medium text-slate-500 mb-3">
                      Bank account
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Account number
                        </label>
                        <input
                          type="text"
                          value={autoFundForm.account_number}
                          onChange={(e) =>
                            setAF("account_number", e.target.value)
                          }
                          placeholder="0123456789"
                          maxLength={10}
                          className={`${inputCls} font-mono`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Account name
                        </label>
                        <input
                          type="text"
                          value={autoFundForm.account_name}
                          onChange={(e) =>
                            setAF("account_name", e.target.value)
                          }
                          placeholder="e.g. Adex VTU Nigeria"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Bank
                        </label>
                        <select
                          value={autoFundForm.bank_code}
                          onChange={(e) => {
                            const selectedBank = banks.find(
                              (bank) => bank.code === e.target.value,
                            );
                            setAF("bank_code", e.target.value);
                            setAF("bank_name", selectedBank?.name ?? "");
                          }}
                          className={selectCls}
                          disabled={
                            loadingBanks || !autoFundForm.funding_provider_id
                          }
                        >
                          <option value="">
                            {loadingBanks ? "Loading banks…" : "Select bank…"}
                          </option>
                          {banks.map((bank) => (
                            <option key={bank.code} value={bank.code}>
                              {bank.name}
                            </option>
                          ))}
                        </select>
                        {!loadingBanks &&
                          autoFundForm.funding_provider_id &&
                          banks.length === 0 && (
                            <p className="mt-1 text-xs text-amber-600">
                              No banks are available for this gateway yet.
                            </p>
                          )}
                        {autoFundForm.bank_code && (
                          <p className="mt-1 text-xs text-slate-400 font-mono">
                            Code: {autoFundForm.bank_code}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save button */}
                <Button
                  fullWidth
                  disabled={savingAutoFund}
                  loading={savingAutoFund}
                  onClick={() => void handleSaveAutoFund()}
                  variant={autoFundSaved ? "secondary" : "primary"}
                >
                  {savingAutoFund ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                    </>
                  ) : autoFundSaved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{" "}
                      Saved
                    </>
                  ) : (
                    "Save settings"
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

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
