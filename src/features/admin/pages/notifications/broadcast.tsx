import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  CheckCircle2, AlertCircle, Radio, Clock, Bell, Mail, MessageSquare,
  Users, Send, X, Eye, Search, ShieldCheck, CalendarClock, Tag,
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
import { roleService, type Role } from "../customers/service";
import {
  broadcastService,
  type AudienceFilters,
  type AudienceMode,
  type BroadcastChannel,
  type BroadcastHistoryItem,
  type BroadcastUserSearchResult,
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

// A single "N to M" range condition the admin can flip on and fill in —
// shared shape for wallet balance / transaction count / transaction volume
// / referral count, each rendered by RangeCondition below.
type RangeState = { enabled: boolean; min: string; max: string };
const blankRange = (): RangeState => ({ enabled: false, min: "", max: "" });

function RangeCondition({
  label, hint, unit, state, onChange,
}: {
  label: string;
  hint: string;
  unit?: string;
  state: RangeState;
  onChange: (next: RangeState) => void;
}) {
  return (
    <div className={`rounded-lg border px-3.5 py-2.5 transition-colors ${state.enabled ? "border-[#111827]/30 bg-[#111827]/[0.03]" : "border-gray-200"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{hint}</p>
        </div>
        <Toggle value={state.enabled} onChange={() => onChange({ ...state, enabled: !state.enabled })} />
      </div>
      {state.enabled && (
        <div className="grid grid-cols-2 gap-2.5 mt-2.5">
          <input
            type="number"
            min={0}
            value={state.min}
            onChange={(e) => onChange({ ...state, min: e.target.value })}
            placeholder={`Min${unit ? ` (${unit})` : ""}`}
            className={inputCls}
          />
          <input
            type="number"
            min={0}
            value={state.max}
            onChange={(e) => onChange({ ...state, max: e.target.value })}
            placeholder={`Max${unit ? ` (${unit})` : ""}`}
            className={inputCls}
          />
        </div>
      )}
    </div>
  );
}

export default function BroadcastPage() {
  const { user } = useAuth();

  // Who — audience targeting
  const [audienceMode, setAudienceMode] = useState<AudienceMode>("criteria");
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesAvailable, setRolesAvailable] = useState(true);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [newUsers, setNewUsers] = useState<{ enabled: boolean; days: string }>({ enabled: false, days: "7" });
  const [walletRange, setWalletRange] = useState<RangeState>(blankRange());
  const [txCountRange, setTxCountRange] = useState<RangeState>(blankRange());
  const [txAmountRange, setTxAmountRange] = useState<RangeState>(blankRange());
  const [referralRange, setReferralRange] = useState<RangeState>(blankRange());

  const [selectedUsers, setSelectedUsers] = useState<BroadcastUserSearchResult[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<BroadcastUserSearchResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  // What — content per channel
  const [broadcastName, setBroadcastName] = useState("");
  const [channels, setChannels] = useState<BroadcastChannel[]>(["database"]);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [priorityHigh, setPriorityHigh] = useState(false);

  // When
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState("");

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [history, setHistory] = useState<BroadcastHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [detailBroadcast, setDetailBroadcast] =
    useState<BroadcastHistoryItem | null>(null);

  const loadHistory = () => {
    setHistoryLoading(true);
    broadcastService
      .getHistory()
      .then(setHistory)
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    loadHistory();
    roleService
      .getAll()
      .then(setRoles)
      .catch(() => setRolesAvailable(false));
  }, []);

  // Debounced user search for "target specific individuals".
  useEffect(() => {
    if (audienceMode !== "individuals" || userQuery.trim().length < 2) {
      setUserResults([]);
      return;
    }
    setSearchingUsers(true);
    const handle = setTimeout(() => {
      broadcastService
        .searchUsers(userQuery.trim())
        .then((found) => setUserResults(found.filter((u) => !selectedUsers.some((s) => s.id === u.id))))
        .finally(() => setSearchingUsers(false));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userQuery, audienceMode, selectedUsers]);

  const toggleInArray = <T,>(arr: T[], value: T, setArr: (v: T[]) => void) => {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const buildFilters = (): AudienceFilters => {
    if (audienceMode === "individuals") {
      return { audience_mode: "individuals", user_ids: selectedUsers.map((u) => u.id) };
    }
    const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
    return {
      audience_mode: "criteria",
      role_ids: roleIds.length > 0 ? roleIds : undefined,
      signed_up_within_days: newUsers.enabled ? num(newUsers.days) : undefined,
      wallet_balance_min: walletRange.enabled ? num(walletRange.min) : undefined,
      wallet_balance_max: walletRange.enabled ? num(walletRange.max) : undefined,
      transaction_count_min: txCountRange.enabled ? num(txCountRange.min) : undefined,
      transaction_count_max: txCountRange.enabled ? num(txCountRange.max) : undefined,
      transaction_amount_min: txAmountRange.enabled ? num(txAmountRange.min) : undefined,
      transaction_amount_max: txAmountRange.enabled ? num(txAmountRange.max) : undefined,
      referral_count_min: referralRange.enabled ? num(referralRange.min) : undefined,
      referral_count_max: referralRange.enabled ? num(referralRange.max) : undefined,
    };
  };

  // Live "how many people will this reach" — refetched (debounced) whenever
  // any targeting input changes.
  const filtersKey = JSON.stringify(buildFilters());
  const firstCountRun = useRef(true);
  useEffect(() => {
    setCountLoading(true);
    const handle = setTimeout(() => {
      broadcastService
        .getAudienceCount(JSON.parse(filtersKey))
        .then(setAudienceCount)
        .catch(() => setAudienceCount(null))
        .finally(() => {
          setCountLoading(false);
          firstCountRun.current = false;
        });
    }, firstCountRun.current ? 0 : 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const hasEmail = channels.includes("Email");
  const hasSms = channels.includes("sms");
  const hasDatabase = channels.includes("database");

  const missing: string[] = [];
  if (audienceMode === "individuals" && selectedUsers.length === 0) missing.push("select at least one person");
  if (channels.length === 0) missing.push("pick at least one channel");
  if (hasDatabase && !(notifTitle.trim() && notifMessage.trim())) missing.push("fill in the in-app title & message");
  if (hasEmail && !(emailSubject.trim() && emailBody.trim())) missing.push("fill in the email subject & body");
  if (hasSms && !smsMessage.trim()) missing.push("fill in the SMS message");
  if (scheduleMode === "later" && !scheduleDate) missing.push("pick a schedule date/time");
  if (countLoading || audienceCount === null) missing.push("wait for the audience count");
  if (!countLoading && audienceCount === 0) missing.push("choose an audience with at least one recipient");

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
    if (audienceCount === null || audienceCount < 1) {
      setSendError("Choose an audience with at least one recipient before sending.");
      setConfirmOpen(false);
      return;
    }

    setSending(true);
    setSendError(null);
    setResult(null);
    try {
      const sendNow = scheduleMode === "now";
      const { notified, recipient_count } = await broadcastService.send({
        ...buildFilters(),
        name: broadcastName.trim() || undefined,
        channels,
        notifTitle: hasDatabase ? notifTitle.trim() : undefined,
        notifMessage: hasDatabase ? notifMessage.trim() : undefined,
        emailSubject: hasEmail ? emailSubject.trim() : undefined,
        emailBody: hasEmail ? emailBody.trim() : undefined,
        smsMessage: hasSms ? smsMessage.trim() : undefined,
        sendNow,
        scheduleDate: sendNow ? null : new Date(scheduleDate).toISOString(),
        priorityHigh,
      });
      setResult(
        sendNow
          ? `Sent to ${notified} recipient${notified === 1 ? "" : "s"}.`
          : `Scheduled for ${recipient_count ?? 0} recipient${recipient_count === 1 ? "" : "s"}.`,
      );
      setConfirmOpen(false);
      setBroadcastName("");
      setNotifTitle("");
      setNotifMessage("");
      setEmailSubject("");
      setEmailBody("");
      setSmsMessage("");
      setSelectedUsers([]);
      setScheduleMode("now");
      setScheduleDate("");
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
      <PageHeader title="Broadcast" description="Full control over who receives a message, what it says, how it's delivered, and when" />

      {result !== null && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {result}
        </div>
      )}
      {sendError && <ErrorBanner message={sendError} />}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="space-y-5">
          {/* WHO */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Who — audience
                </span>
              </SectionTitle>
              <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                {(["criteria", "individuals"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAudienceMode(mode)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      audienceMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {mode === "criteria" ? "By criteria" : "Specific people"}
                  </button>
                ))}
              </div>
            </div>

            {audienceMode === "individuals" ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Search by username, email, or name..."
                    className={`${inputCls} pl-9`}
                  />
                </div>

                {userQuery.trim().length >= 2 && (
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {searchingUsers ? (
                      <div className="p-3">
                        <SkeletonLine className="h-8 w-full" />
                      </div>
                    ) : userResults.length === 0 ? (
                      <p className="p-3 text-xs text-slate-400">No matching users.</p>
                    ) : (
                      userResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedUsers((prev) => [...prev, u]);
                            setUserQuery("");
                          }}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-900 truncate">{u.fullname} · @{u.username}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-[#111827]/10 text-[#111827] text-xs font-medium"
                      >
                        @{u.username}
                        <button
                          type="button"
                          onClick={() => setSelectedUsers((prev) => prev.filter((s) => s.id !== u.id))}
                          className="hover:opacity-60 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {rolesAvailable && roles.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" /> Real role
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {roles.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => toggleInArray(roleIds, Number(role.id), setRoleIds)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            roleIds.includes(Number(role.id))
                              ? "border-[#111827] bg-[#111827]/10 text-[#111827]"
                              : "border-gray-200 text-slate-600 hover:border-gray-300"
                          }`}
                        >
                          {role.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">Conditions (all combined with AND)</p>
                  <div className="space-y-2.5">
                    <div className={`rounded-lg border px-3.5 py-2.5 transition-colors ${newUsers.enabled ? "border-[#111827]/30 bg-[#111827]/[0.03]" : "border-gray-200"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">New users</p>
                          <p className="text-xs text-slate-500 mt-0.5">Signed up within the last N days.</p>
                        </div>
                        <Toggle value={newUsers.enabled} onChange={() => setNewUsers((v) => ({ ...v, enabled: !v.enabled }))} />
                      </div>
                      {newUsers.enabled && (
                        <input
                          type="number"
                          min={1}
                          value={newUsers.days}
                          onChange={(e) => setNewUsers((v) => ({ ...v, days: e.target.value }))}
                          placeholder="Days"
                          className={`${inputCls} mt-2.5 max-w-[140px]`}
                        />
                      )}
                    </div>

                    <RangeCondition
                      label="Wallet balance"
                      hint="Current wallet balance range."
                      unit="₦"
                      state={walletRange}
                      onChange={setWalletRange}
                    />
                    <RangeCondition
                      label="Transaction count"
                      hint="Number of successful transactions."
                      state={txCountRange}
                      onChange={setTxCountRange}
                    />
                    <RangeCondition
                      label="Transaction volume"
                      hint="Total ₦ spent across successful transactions."
                      unit="₦"
                      state={txAmountRange}
                      onChange={setTxAmountRange}
                    />
                    <RangeCondition
                      label="Referral count"
                      hint="Number of people they've referred."
                      state={referralRange}
                      onChange={setReferralRange}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3.5 py-2.5">
              <span className="text-xs text-slate-500">This will reach</span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {countLoading ? "…" : audienceCount === null ? "—" : `${audienceCount} recipient${audienceCount === 1 ? "" : "s"}`}
              </span>
            </div>
          </Card>

          {/* WHAT */}
          <Card className="p-5 space-y-5">
            <div>
              <SectionTitle>
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Label (for your own history — not shown to recipients)
                </span>
              </SectionTitle>
              <input
                value={broadcastName}
                onChange={(e) => setBroadcastName(e.target.value.slice(0, 255))}
                placeholder="e.g. March promo, Maintenance notice"
                className={inputCls}
              />
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
          </Card>

          {/* WHEN */}
          <Card className="p-5 space-y-4">
            <SectionTitle>
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5" /> When
              </span>
            </SectionTitle>
            <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg w-fit">
              {(["now", "later"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setScheduleMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    scheduleMode === mode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {mode === "now" ? "Send now" : "Schedule for later"}
                </button>
              ))}
            </div>
            {scheduleMode === "later" && (
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className={`${inputCls} max-w-xs`}
              />
            )}

            <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3.5 py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-900">High priority</p>
                <p className="text-xs text-slate-500 mt-0.5">Flags this broadcast as urgent for the recipient.</p>
              </div>
              <Toggle value={priorityHigh} onChange={() => setPriorityHigh((v) => !v)} />
            </div>

            <div>
              <Button fullWidth disabled={!isValid || sending} loading={sending} onClick={() => setConfirmOpen(true)}>
                {sending ? "" : (<><Send className="w-4 h-4" /> Review &amp; {scheduleMode === "now" ? "send" : "schedule"}</>)}
              </Button>
              {!isValid && (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Before sending: {missing.join(", ")}.
                </p>
              )}
            </div>
          </Card>
        </div>

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
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setDetailBroadcast(b)}
                    className="block w-full p-4 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{b.name || b.title || "Untitled"}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={b.sent ? "success" : "pending"} />
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-[#111827]" title="View broadcast details">
                          <Eye className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{b.message}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{" "}
                        {b.scheduled_at && !b.sent
                          ? `Scheduled ${new Date(b.scheduled_at).toLocaleString()}`
                          : new Date(b.created_at).toLocaleDateString()}
                      </p>
                      <span className="text-xs text-slate-300">·</span>
                      <p className="text-xs text-slate-400">{b.audience_label} ({b.recipient_count})</p>
                      <span className="text-xs text-slate-300">·</span>
                      <div className="flex items-center gap-1">
                        {b.channels.map((c) => {
                          const Icon = channelIcons[c] ?? Bell;
                          return <Icon key={c} className="w-3 h-3 text-slate-400" />;
                        })}
                      </div>
                    </div>
                  </button>
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
              <h3 className="font-semibold text-slate-900 text-sm">
                {scheduleMode === "now" ? "Send this broadcast?" : "Schedule this broadcast?"}
              </h3>
              <button
                onClick={() => setConfirmOpen(false)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-500">
                This reaches <strong>{countLoading ? "…" : (audienceCount ?? 0)} recipient{audienceCount === 1 ? "" : "s"}</strong>, over{" "}
                <strong>{channels.map((c) => channelOptions.find((o) => o.value === c)?.label).join(", ")}</strong>
                {scheduleMode === "later" && scheduleDate ? (
                  <> on <strong>{new Date(scheduleDate).toLocaleString()}</strong></>
                ) : null}
                . This can't be undone.
              </p>
              {sendError && <ErrorBanner message={sendError} />}
              <div className="flex gap-3 pt-1">
                <Button variant="secondary" fullWidth onClick={() => setConfirmOpen(false)} disabled={sending}>
                  Cancel
                </Button>
                <Button fullWidth onClick={() => void doSend()} loading={sending} disabled={sending}>
                  {sending ? "" : scheduleMode === "now" ? "Send now" : "Schedule"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {detailBroadcast && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-lg">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Broadcast details
                </p>
                <h3 className="truncate text-sm font-semibold text-slate-900">
                  {detailBroadcast.name || detailBroadcast.title || "Untitled"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailBroadcast(null)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-gray-100"
                aria-label="Close broadcast details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(85vh-73px)] space-y-4 overflow-y-auto p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={detailBroadcast.sent ? "success" : "pending"} />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Recipients</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {detailBroadcast.recipient_count}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Audience</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {detailBroadcast.audience_label || "Not specified"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Date</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {detailBroadcast.scheduled_at && !detailBroadcast.sent
                      ? `Scheduled ${new Date(detailBroadcast.scheduled_at).toLocaleString()}`
                      : new Date(detailBroadcast.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Channels</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {detailBroadcast.channels.map((channel) => {
                    const Icon = channelIcons[channel] ?? Bell;
                    return (
                      <span
                        key={channel}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {channelOptions.find((option) => option.value === channel)?.label ?? channel}
                      </span>
                    );
                  })}
                </div>
              </div>

              {detailBroadcast.title && (
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Title / subject</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{detailBroadcast.title}</p>
                </div>
              )}

              {detailBroadcast.message && (
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Message</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {detailBroadcast.message}
                  </p>
                </div>
              )}

              {detailBroadcast.payload?.emailBody && (
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Email body</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {detailBroadcast.payload.emailBody}
                  </p>
                </div>
              )}

              {detailBroadcast.payload?.smsMessage && (
                <div className="rounded-lg border border-gray-100 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">SMS message</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {detailBroadcast.payload.smsMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
