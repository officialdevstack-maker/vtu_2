import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CheckCircle2, AlertCircle, Radio, Clock, Bell, Mail, MessageSquare,
  Users, Send, X, Eye,
} from "lucide-react";
import {
  PageHeader,
  Card,
  Button,
  Toggle,
  StatusBadge,
  SkeletonLine,
  EmptyState,
  inputCls,
} from "../../../user/components/shared-ui";
import { useAuth } from "@/shared/providers/auth";
import {
  broadcastService,
  type BroadcastChannel,
  type BroadcastHistoryItem,
  type BroadcastRecipientType,
} from "./service";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
      {children}
    </h3>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    const validationErrors = data?.errors;
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      return Object.values(validationErrors).flat().join(" ");
    }
    if (typeof data?.message === "string") return data.message;
  }
  return "Could not send this broadcast. Please try again.";
}

// Mirrors App\Classes\TemplateParser::parse() client-side, just for the
// preview — the real substitution happens server-side, per recipient.
function renderPreview(template: string, sample: Record<string, string>): string {
  return template.replace(/{{\s*user\.(\w+)\s*}}/g, (match, key) => sample[key] ?? match);
}

const recipientOptions: { value: BroadcastRecipientType; label: string }[] = [
  { value: "user", label: "Users" },
  { value: "agent", label: "Agents" },
  { value: "api", label: "API resellers" },
  { value: "bonanza", label: "Bonanza tier" },
  { value: "admin", label: "Admins" },
];

const channelOptions: { value: BroadcastChannel; label: string; hint: string; icon: typeof Bell }[] = [
  { value: "database", label: "In-app", hint: "Shows in the recipient's notification bell.", icon: Bell },
  { value: "Email", label: "Email", hint: "Sent to each recipient's registered email.", icon: Mail },
  { value: "sms", label: "SMS", hint: "Sent to each recipient's registered phone.", icon: MessageSquare },
];

const channelIcons: Record<BroadcastChannel, typeof Bell> = {
  database: Bell,
  Email: Mail,
  sms: MessageSquare,
};

export default function BroadcastPage() {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState<BroadcastRecipientType[]>(["user"]);
  const [channels, setChannels] = useState<BroadcastChannel[]>(["database"]);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [priorityHigh, setPriorityHigh] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = () => {
    setHistoryLoading(true);
    broadcastService
      .getHistory()
      .then(setHistory)
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const toggleInArray = <T,>(arr: T[], value: T, setArr: (v: T[]) => void) => {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const hasEmail = channels.includes("Email");
  const hasSms = channels.includes("sms");
  const hasDatabase = channels.includes("database");

  const missing: string[] = [];
  if (recipients.length === 0) missing.push("pick at least one recipient");
  if (channels.length === 0) missing.push("pick at least one channel");
  if (hasDatabase && !(notifTitle.trim() && notifMessage.trim())) missing.push("fill in the in-app title & message");
  if (hasEmail && !(emailSubject.trim() && emailBody.trim())) missing.push("fill in the email subject & body");
  if (hasSms && !smsMessage.trim()) missing.push("fill in the SMS message");

  const isValid = missing.length === 0;

  const sample = {
    fullname: user?.fullname ?? user?.username ?? "Jane Doe",
    username: user?.username ?? "janedoe",
    email: user?.email ?? "jane@example.com",
  };

  const previewBlocks = useMemo(() => {
    const blocks: { icon: typeof Bell; title: string; body: string }[] = [];
    if (hasDatabase && (notifTitle || notifMessage)) {
      blocks.push({ icon: Bell, title: renderPreview(notifTitle, sample) || "(no title)", body: renderPreview(notifMessage, sample) || "(no message)" });
    }
    if (hasEmail && (emailSubject || emailBody)) {
      blocks.push({ icon: Mail, title: renderPreview(emailSubject, sample) || "(no subject)", body: renderPreview(emailBody, sample) || "(no body)" });
    }
    if (hasSms && smsMessage) {
      blocks.push({ icon: MessageSquare, title: "SMS", body: renderPreview(smsMessage, sample) });
    }
    return blocks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDatabase, hasEmail, hasSms, notifTitle, notifMessage, emailSubject, emailBody, smsMessage, user]);

  const doSend = async () => {
    setSending(true);
    setSendError(null);
    setResult(null);
    try {
      const { notified } = await broadcastService.send({
        channels,
        recipients,
        notifTitle: hasDatabase ? notifTitle.trim() : undefined,
        notifMessage: hasDatabase ? notifMessage.trim() : undefined,
        emailSubject: hasEmail ? emailSubject.trim() : undefined,
        emailBody: hasEmail ? emailBody.trim() : undefined,
        smsMessage: hasSms ? smsMessage.trim() : undefined,
        sendNow: true,
        scheduleDate: null,
        priorityHigh,
      });
      setResult(notified);
      setConfirmOpen(false);
      setNotifTitle("");
      setNotifMessage("");
      setEmailSubject("");
      setEmailBody("");
      setSmsMessage("");
      loadHistory();
    } catch (err) {
      setSendError(extractErrorMessage(err));
      setConfirmOpen(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Broadcast" description="Send a message to every user of a chosen type, over any combination of channels" />

      {result !== null && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Sent to {result} recipient{result === 1 ? "" : "s"}.
        </div>
      )}
      {sendError && <ErrorBanner message={sendError} />}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        <Card className="p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Recipients
                </span>
              </SectionTitle>
              <button
                type="button"
                onClick={() =>
                  setRecipients(
                    recipients.length === recipientOptions.length
                      ? []
                      : recipientOptions.map((o) => o.value),
                  )
                }
                className="text-xs font-medium text-[#111827] hover:opacity-70 transition-opacity"
              >
                {recipients.length === recipientOptions.length ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recipientOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleInArray(recipients, opt.value, setRecipients)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    recipients.includes(opt.value)
                      ? "border-[#111827] bg-[#111827]/10 text-[#111827]"
                      : "border-gray-200 text-slate-600 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>Channels</SectionTitle>
            <div className="space-y-2.5">
              {channelOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 transition-colors ${
                    channels.includes(opt.value) ? "border-[#111827]/30 bg-[#111827]/[0.03]" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#111827]/10 text-[#111827] flex items-center justify-center shrink-0">
                      <opt.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{opt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.hint}</p>
                    </div>
                  </div>
                  <Toggle
                    value={channels.includes(opt.value)}
                    onChange={() => toggleInArray(channels, opt.value, setChannels)}
                  />
                </div>
              ))}
            </div>
          </div>

          {hasDatabase && (
            <div>
              <SectionTitle>In-app notification</SectionTitle>
              <div className="space-y-3">
                <div>
                  <input
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value.slice(0, 100))}
                    placeholder="Title, e.g. New feature: Airtime to Cash"
                    className={inputCls}
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">{notifTitle.length}/100</p>
                </div>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Message body"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          )}

          {hasEmail && (
            <div>
              <SectionTitle>Email</SectionTitle>
              <div className="space-y-3">
                <div>
                  <input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value.slice(0, 150))}
                    placeholder="Subject"
                    className={inputCls}
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">{emailSubject.length}/150</p>
                </div>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Email body"
                  rows={4}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          )}

          {hasSms && (
            <div>
              <SectionTitle>SMS</SectionTitle>
              <textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value.slice(0, 160))}
                placeholder="SMS message (160 characters max)"
                rows={2}
                className={`${inputCls} resize-none`}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{smsMessage.length}/160</p>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Use <code className="font-mono">{"{{user.fullname}}"}</code>,{" "}
            <code className="font-mono">{"{{user.username}}"}</code>, or{" "}
            <code className="font-mono">{"{{user.email}}"}</code> anywhere above to personalize per recipient — see the
            live preview on the right.
          </p>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3.5 py-2.5">
            <div>
              <p className="text-sm font-medium text-slate-900">High priority</p>
              <p className="text-xs text-slate-500 mt-0.5">Flags this broadcast as urgent for the recipient.</p>
            </div>
            <Toggle value={priorityHigh} onChange={() => setPriorityHigh((v) => !v)} />
          </div>

          <div>
            <Button fullWidth disabled={!isValid || sending} loading={sending} onClick={() => setConfirmOpen(true)}>
              {sending ? "" : (<><Send className="w-4 h-4" /> Review &amp; send</>)}
            </Button>
            {!isValid && (
              <p className="text-xs text-slate-400 mt-2 text-center">
                Before sending: {missing.join(", ")}.
              </p>
            )}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Live preview
            </h3>
            {previewBlocks.length === 0 ? (
              <p className="text-xs text-slate-400">Start typing to preview your message, personalized as if it were sent to you.</p>
            ) : (
              <div className="space-y-3">
                {previewBlocks.map((block, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-[#111827]/10 text-[#111827] flex items-center justify-center shrink-0">
                        <block.icon className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-900 truncate">{block.title}</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{block.body}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-slate-900 text-sm">Recent broadcasts</h3>
            </div>
            {historyLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <SkeletonLine key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <EmptyState icon={Radio} title="No broadcasts sent yet" description="Sent broadcasts will show up here." />
            ) : (
              <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
                {history.map((b) => (
                  <div key={b.id} className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{b.title ?? "Untitled"}</p>
                      <StatusBadge status={b.sent ? "success" : "pending"} />
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{b.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(b.created_at).toLocaleDateString()}
                      </p>
                      <span className="text-xs text-slate-300">·</span>
                      <p className="text-xs text-slate-400">{b.audience_label}</p>
                      <span className="text-xs text-slate-300">·</span>
                      <div className="flex items-center gap-1">
                        {b.channels.map((c) => {
                          const Icon = channelIcons[c] ?? Bell;
                          return <Icon key={c} className="w-3 h-3 text-slate-400" />;
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-lg">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Send this broadcast?</h3>
              <button
                onClick={() => setConfirmOpen(false)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-500">
                This sends immediately to every <strong>{recipients.join(", ")}</strong> account, over{" "}
                <strong>{channels.map((c) => channelOptions.find((o) => o.value === c)?.label).join(", ")}</strong>.
                This can't be undone.
              </p>
              {sendError && <ErrorBanner message={sendError} />}
              <div className="flex gap-3 pt-1">
                <Button variant="secondary" fullWidth onClick={() => setConfirmOpen(false)} disabled={sending}>
                  Cancel
                </Button>
                <Button fullWidth onClick={() => void doSend()} loading={sending} disabled={sending}>
                  {sending ? "" : "Send now"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
