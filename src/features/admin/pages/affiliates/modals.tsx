import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRightLeft, Send, UserCheck, X } from "lucide-react";
import {
  Button,
  SkeletonLine,
  inputCls,
} from "../../../user/components/shared-ui";
import {
  childCustomerService,
  type ChildCustomer,
  type ChildCustomerMessage,
  type MigrationResult,
} from "./service";

export const fmt = (v: string | number | null | undefined) => {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  return Number.isFinite(n) ? `₦${n.toLocaleString()}` : String(v);
};

export function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (typeof data?.message === "string") return data.message;
  }
  return fallback;
}

// One customer's hand-off to the parent platform. Two-step: a confirm view
// spelling out exactly what will (and won't — the wallet balance) happen,
// then a result view once the backend has created/linked the account and
// queued the redirect_user directive.
export function MigrateCustomerModal({
  instanceId,
  customer,
  onClose,
  onMigrated,
}: {
  instanceId: string;
  customer: ChildCustomer;
  onClose: () => void;
  onMigrated: () => void;
}) {
  const [targetUrl, setTargetUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const handleMigrate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await childCustomerService.migrate(instanceId, customer.id, targetUrl.trim() || undefined);
      setResult(res);
      onMigrated();
    } catch (err) {
      setError(extractErrorMessage(err, "Could not migrate this customer. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-sm shadow-xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            {result ? "Migration queued" : "Migrate to parent"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {result ? (
          <div className="p-4 space-y-3.5">
            <p className="text-xs text-slate-600">
              {result.linked_existing
                ? "This customer already had a matching account here, so they were linked to it."
                : result.invite_sent
                  ? "A parent account was created and a claim email with a set-your-password link is on its way to the customer."
                  : "A parent account was created, but the claim email could not be sent — the customer can still use the normal forgot-password flow."}
            </p>
            <div className="rounded-lg bg-gray-50 px-3 py-2.5">
              <p className="text-xs text-slate-700 font-medium">{result.user.username}</p>
              <p className="text-[11px] text-slate-400">{result.user.email}</p>
            </div>
            <p className="text-[11px] text-slate-400">
              Directive #{result.directive_id} is queued — the child app picks it up on its next
              poll and starts steering this customer here.
            </p>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" fullWidth onClick={onClose}>
                Done
              </Button>
              <Link to={`/admin/customers/users/${result.user.id}`} className="w-full">
                <Button fullWidth>
                  <UserCheck className="w-3.5 h-3.5" /> View account
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="rounded-lg bg-gray-50 px-3 py-2.5 space-y-0.5">
              <p className="text-xs text-slate-700 font-medium">{customer.username ?? customer.external_id}</p>
              <p className="text-[11px] text-slate-400">{customer.email ?? "no email synced"}</p>
              <p className="text-[11px] text-slate-400">{customer.phone ?? "no phone synced"}</p>
            </div>

            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li>
                Creates a real account for this customer here on the parent — or links an existing
                one if the email or phone already matches a user.
              </li>
              <li>
                Queues a <code className="font-mono text-[11px]">redirect_user</code> directive so
                the child starts steering them to the parent at their next login.
              </li>
            </ul>

            <div className="rounded-lg bg-amber-50 px-3 py-2.5">
              <p className="text-[11px] text-amber-700">
                Their child wallet balance ({fmt(customer.wallet_balance)}) is <strong>not</strong>{" "}
                transferred. If it should carry over, fund their parent account manually afterwards.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Redirect URL (optional)
              </label>
              <input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Defaults to this platform's site URL"
                className={inputCls}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" fullWidth onClick={onClose}>
                Cancel
              </Button>
              <Button fullWidth disabled={busy} loading={busy} onClick={() => void handleMigrate()}>
                <ArrowRightLeft className="w-3.5 h-3.5" /> Migrate
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// One-off email thread with a single child customer — history on top,
// compose below, so repeated contact reads as a conversation. Only our
// outbound half is recorded; replies go to the admin's normal inbox.
export function EmailCustomerModal({
  instanceId,
  customer,
  onClose,
  onSent,
}: {
  instanceId: string;
  customer: ChildCustomer;
  onClose: () => void;
  onSent?: () => void;
}) {
  const [messages, setMessages] = useState<ChildCustomerMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    childCustomerService
      .getMessages(instanceId, customer.id)
      .then(setMessages)
      .finally(() => setLoadingHistory(false));
  }, [instanceId, customer.id]);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const sent = await childCustomerService.sendMessage(instanceId, customer.id, subject.trim(), body.trim());
      setMessages((prev) => [sent, ...prev]);
      setSubject("");
      setBody("");
      onSent?.();
    } catch (err) {
      setError(extractErrorMessage(err, "Could not send the email. Please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200/70 w-full max-w-md shadow-xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm">Email customer</h3>
            <p className="text-[11px] text-slate-400 truncate">{customer.username ?? customer.external_id} · {customer.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {error && <p className="text-xs text-red-600">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Subject <span className="text-red-400">*</span>
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Your account is moving"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder={"Hi {{ user.username }}, …"}
              className={inputCls}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Placeholders like <code className="font-mono">{"{{ user.username }}"}</code> are filled in per customer.
            </p>
          </div>

          <Button fullWidth disabled={!subject.trim() || !body.trim() || sending} loading={sending} onClick={() => void handleSend()}>
            <Send className="w-3.5 h-3.5" /> Send email
          </Button>

          <div className="pt-1">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-2">Previous emails</p>
            {loadingHistory ? (
              <SkeletonLine className="h-4 w-full" />
            ) : messages.length === 0 ? (
              <p className="text-xs text-slate-400">None yet — this is the first contact.</p>
            ) : (
              <div className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className="rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-xs text-slate-700 font-medium truncate">{m.subject}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {m.created_at ? new Date(m.created_at).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 whitespace-pre-wrap break-words">{m.body}</p>
                    {m.sender && <p className="text-[10px] text-slate-400 mt-1">sent by {m.sender.username}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
