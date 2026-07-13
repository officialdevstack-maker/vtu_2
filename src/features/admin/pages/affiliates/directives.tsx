import { useEffect, useState } from "react";
import { ListChecks, RefreshCw, Send, Trash2, X } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  SkeletonRows,
  StatusBadge,
  inputCls,
  selectCls,
} from "../../../user/components/shared-ui";
import {
  childDirectiveService,
  type ChildDirective,
  type ChildDirectiveStatus,
  type DirectiveType,
} from "./service";
import { useAffiliate } from "./affiliate-layout";
import { extractErrorMessage } from "./modals";

// Directive *types* are just labeled conventions between parent and child —
// nothing enforces this list server-side (ChildDirective::type is a plain
// string column). This UI just makes the most obvious guidance actions easy
// to compose correctly, with an escape hatch for anything else.
// The child acks each directive with the real outcome (see the parent's
// ChildDirectiveController::ack): executed = applied, failed = could not be
// applied (result note says why), skipped = the child doesn't support the
// type, delivered = acked by an older child that doesn't report outcomes.
const BADGE_FOR_STATUS: Record<ChildDirectiveStatus, string> = {
  pending: "pending",
  delivered: "success",
  executed: "success",
  failed: "failed",
  skipped: "failed",
};

const STATUS_HELP: Record<string, string> = {
  pending: "Waiting for the affiliate's next poll (~5 minutes).",
  delivered: "Acknowledged by the affiliate (older child version — outcome not reported).",
  executed: "The affiliate applied this directive.",
  failed: "The affiliate could not apply this directive — see the result note.",
  skipped: "The affiliate does not support this directive type.",
};

const DIRECTIVE_TYPE_OPTIONS: { value: DirectiveType; label: string; description: string }[] = [
  { value: "message", label: "Message", description: "A plain-text note for whoever operates this affiliate." },
  { value: "redirect_user", label: "Redirect user", description: "Ask the child to redirect a specific customer to the parent." },
  { value: "retry_transaction", label: "Retry transaction", description: "Ask the child to retry a specific failed transaction." },
  { value: "custom", label: "Custom", description: "Any other directive type, with a hand-written JSON payload." },
];

function SendDirectiveModal({
  instanceId,
  onClose,
  onSent,
}: {
  instanceId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [type, setType] = useState<DirectiveType>("message");
  const [text, setText] = useState("");
  const [externalId, setExternalId] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [reason, setReason] = useState("");
  const [customType, setCustomType] = useState("");
  const [customPayload, setCustomPayload] = useState("{}");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildPayload = (): { type: string; payload: Record<string, unknown> } | null => {
    if (type === "message") {
      if (!text.trim()) return null;
      return { type: "message", payload: { text: text.trim() } };
    }
    if (type === "redirect_user") {
      if (!externalId.trim() || !targetUrl.trim()) return null;
      return { type: "redirect_user", payload: { external_id: externalId.trim(), target_url: targetUrl.trim() } };
    }
    if (type === "retry_transaction") {
      if (!externalId.trim()) return null;
      return { type: "retry_transaction", payload: { external_id: externalId.trim(), reason: reason.trim() } };
    }
    if (!customType.trim()) return null;
    try {
      const parsed = JSON.parse(customPayload || "{}") as Record<string, unknown>;
      return { type: customType.trim(), payload: parsed };
    } catch {
      return null;
    }
  };

  const built = buildPayload();
  const customJsonInvalid = type === "custom" && customPayload.trim() !== "" && built === null && customType.trim() !== "";

  const handleSend = async () => {
    if (!built) return;
    setSending(true);
    setError(null);
    try {
      await childDirectiveService.create(instanceId, built.type, built.payload);
      onSent();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, "Could not send the directive. Please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">Send directive</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-xs text-red-600">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DirectiveType)}
              className={selectCls}
            >
              {DIRECTIVE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              {DIRECTIVE_TYPE_OPTIONS.find((o) => o.value === type)?.description}
            </p>
          </div>

          {type === "message" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="e.g. Please review your last 3 failed transactions."
                className={inputCls}
              />
            </div>
          )}

          {(type === "redirect_user" || type === "retry_transaction") && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Customer external ID <span className="text-red-400">*</span>
              </label>
              <input
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                placeholder="The child's own customer/user ID"
                className={inputCls}
              />
            </div>
          )}

          {type === "redirect_user" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Redirect URL <span className="text-red-400">*</span>
              </label>
              <input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
          )}

          {type === "retry_transaction" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Reason (optional)</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why this transaction should be retried"
                className={inputCls}
              />
            </div>
          )}

          {type === "custom" && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Custom type <span className="text-red-400">*</span>
                </label>
                <input
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="e.g. flag_for_review"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Payload (JSON)</label>
                <textarea
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  rows={4}
                  className={`${inputCls} font-mono`}
                />
                {customJsonInvalid && <p className="text-[11px] text-red-500 mt-1">Not valid JSON.</p>}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button fullWidth disabled={!built || sending} loading={sending} onClick={() => void handleSend()}>
              <Send className="w-3.5 h-3.5" /> Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AffiliateDirectivesPage() {
  const { instance } = useAffiliate();
  const id = String(instance.id);

  const [directives, setDirectives] = useState<ChildDirective[] | null>(null);
  const [composing, setComposing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const load = () => childDirectiveService.getByInstance(id).then(setDirectives);

  const handleDelete = async (d: ChildDirective) => {
    const verb = d.status === "pending" ? "Retract" : "Delete";
    if (!window.confirm(`${verb} this '${d.type}' directive?`)) return;
    setDeletingId(d.id);
    try {
      await childDirectiveService.remove(id, d.id);
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <>
      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3.5 sm:px-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Directives</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Instructions this affiliate picks up on its next poll (~5 minutes).
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Button size="sm" onClick={() => setComposing(true)}>
              <Send className="w-3.5 h-3.5" /> Send directive
            </Button>
          </div>
        </div>

        {directives === null ? (
          <SkeletonRows count={4} withAvatar={false} />
        ) : directives.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No directives sent yet"
            description="Guidance you send this affiliate (redirects, retry instructions, etc.) will appear here once you send one."
            action={
              <Button size="sm" onClick={() => setComposing(true)}>
                <Send className="w-3.5 h-3.5" /> Send directive
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-[860px] w-full table-fixed text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Type", "Payload", "Status", "Result", "Created", "Acked", ""].map((h, index) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-left font-medium text-slate-400 whitespace-nowrap ${
                        index === 1 || index === 3 ? "w-48" : index === 6 ? "w-14" : "w-28"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {directives.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{d.type}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 max-w-xs truncate" title={JSON.stringify(d.payload)}>
                      {JSON.stringify(d.payload)}
                    </td>
                    <td className="px-4 py-3" title={STATUS_HELP[d.status] ?? d.status}>
                      <StatusBadge status={BADGE_FOR_STATUS[d.status] ?? "pending"} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={d.result_note ?? undefined}>
                      {d.result_note ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {d.created_at ? new Date(d.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {d.delivered_at ? new Date(d.delivered_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => void handleDelete(d)}
                        disabled={deletingId === d.id}
                        title={d.status === "pending" ? "Retract — the affiliate will never receive it" : "Delete from history"}
                        className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {composing && (
        <SendDirectiveModal
          instanceId={id}
          onClose={() => setComposing(false)}
          onSent={() => void load()}
        />
      )}
    </>
  );
}
