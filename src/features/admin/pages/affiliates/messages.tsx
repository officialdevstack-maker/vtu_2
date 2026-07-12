import { useEffect, useMemo, useState } from "react";
import { Mail, Megaphone, Send } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  SkeletonRows,
  inputCls,
  selectCls,
} from "../../../user/components/shared-ui";
import {
  childBroadcastService,
  childCustomerService,
  childMessageService,
  type ChildCustomer,
  type ChildCustomerMessageWithCustomer,
} from "./service";
import { useAffiliate } from "./affiliate-layout";
import { EmailCustomerModal, extractErrorMessage } from "./modals";

// The email side of running an affiliate: everything the parent has ever
// sent to this child's customers, plus the two ways to send more — a
// broadcast to every reachable customer, or a one-off to a single one.
// Replies never land here; they go to the admin's normal inbox.
export default function AffiliateMessagesPage() {
  const { instance } = useAffiliate();
  const id = String(instance.id);

  const [customers, setCustomers] = useState<ChildCustomer[]>([]);
  const [messages, setMessages] = useState<ChildCustomerMessageWithCustomer[] | null>(null);

  // Broadcast composer
  const [count, setCount] = useState<number | null>(null);
  // Filters for broadcast-like targeted emails
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [queryFilter, setQueryFilter] = useState("");
  const [walletMinFilter, setWalletMinFilter] = useState<string>("");
  const [walletMaxFilter, setWalletMaxFilter] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // One-off composer
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [emailTarget, setEmailTarget] = useState<ChildCustomer | null>(null);

  const refreshMessages = () => {
    childMessageService.getForInstance(id).then(setMessages);
  };

  useEffect(() => {
    childCustomerService.getByInstance(id).then(setCustomers);
    refreshMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCount = async (useFilters = true) => {
    try {
      const filters: Record<string, unknown> = {};
      if (useFilters && queryFilter.trim()) filters.query = queryFilter.trim();
      if (useFilters && walletMinFilter.trim()) filters.wallet_balance_min = Number(walletMinFilter);
      if (useFilters && walletMaxFilter.trim()) filters.wallet_balance_max = Number(walletMaxFilter);
      const c = await childBroadcastService.countEmailable(id, Object.keys(filters).length ? filters : undefined);
      setCount(c);
    } catch (e) {
      setCount(null);
    }
  };

  useEffect(() => {
    // initial count without filters
    void fetchCount(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const emailableCustomers = useMemo(
    () => customers.filter((c) => c.email),
    [customers],
  );

  const customerName = (m: ChildCustomerMessageWithCustomer): string => {
    const c = m.child_customer ?? m.childCustomer;
    return c?.username ?? c?.email ?? `customer #${m.child_customer_id}`;
  };

  const handleBroadcast = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setError(null);
    try {
      const filters: Record<string, unknown> = {};
      if (filtersOpen && queryFilter.trim()) filters.query = queryFilter.trim();
      if (filtersOpen && walletMinFilter.trim()) filters.wallet_balance_min = Number(walletMinFilter);
      if (filtersOpen && walletMaxFilter.trim()) filters.wallet_balance_max = Number(walletMaxFilter);
      const notified = await childBroadcastService.emailAll(id, subject.trim(), body.trim(), Object.keys(filters).length ? filters : undefined);
      setSentCount(notified);
      setSubject("");
      setBody("");
      refreshMessages();
    } catch (err) {
      setError(extractErrorMessage(err, "Could not send the broadcast. Please try again."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Broadcast to everyone */}
        <Card>
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Megaphone className="w-3.5 h-3.5 text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email all customers</h2>
          </div>
          <div className="p-5 space-y-3.5">
            {error && <p className="text-xs text-red-600">{error}</p>}
            {sentCount !== null && (
              <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                Sent to {sentCount} customer{sentCount === 1 ? "" : "s"} — it's also recorded in the
                broadcast history.
              </p>
            )}
            <p className="text-xs text-slate-500">
              {count === null
                ? "Counting reachable customers…"
                : `Reaches ${count} synced customer${count === 1 ? "" : "s"} with an email address.`}
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. We're upgrading your service"
                className={inputCls}
              />
            </div>
            <div>
              <button
                type="button"
                onClick={() => setFiltersOpen((s) => !s)}
                className="text-xs text-slate-500 underline"
              >
                {filtersOpen ? "Hide filters" : "Show filters"}
              </button>
              {filtersOpen && (
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Search (username or email)</label>
                    <input value={queryFilter} onChange={(e) => setQueryFilter(e.target.value)} className={inputCls} />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] text-slate-600 mb-1">Wallet balance min</label>
                      <input value={walletMinFilter} onChange={(e) => setWalletMinFilter(e.target.value)} className={inputCls} placeholder="0" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[11px] text-slate-600 mb-1">Wallet balance max</label>
                      <input value={walletMaxFilter} onChange={(e) => setWalletMaxFilter(e.target.value)} className={inputCls} placeholder="" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => { setQueryFilter(""); setWalletMinFilter(""); setWalletMaxFilter(""); void fetchCount(false); }}>Reset</Button>
                    <Button onClick={() => void fetchCount(true)}>Apply filters</Button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder={"Hi {{ user.username }}, …"}
                className={inputCls}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Placeholders like <code className="font-mono">{"{{ user.username }}"}</code> are filled in per customer.
              </p>
            </div>
            <Button
              fullWidth
              disabled={!subject.trim() || !body.trim() || sending || count === 0}
              loading={sending}
              onClick={() => void handleBroadcast()}
            >
              <Send className="w-3.5 h-3.5" /> Send broadcast
            </Button>
          </div>
        </Card>

        {/* One-off to a single customer */}
        <Card>
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email one customer</h2>
          </div>
          <div className="p-5 space-y-3.5">
            <p className="text-xs text-slate-500">
              Opens a per-customer thread with this affiliate customer's previous emails, so
              repeated contact reads as a conversation.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className={selectCls}
              >
                <option value="">
                  {emailableCustomers.length === 0
                    ? "No customers with an email address"
                    : "Choose a customer…"}
                </option>
                {emailableCustomers.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {(c.username ?? c.external_id) + " — " + c.email}
                  </option>
                ))}
              </select>
            </div>
            <Button
              fullWidth
              variant="secondary"
              disabled={!selectedCustomerId}
              onClick={() => {
                const target = emailableCustomers.find((c) => String(c.id) === selectedCustomerId);
                if (target) setEmailTarget(target);
              }}
            >
              <Mail className="w-3.5 h-3.5" /> Compose
            </Button>
            <p className="text-[11px] text-slate-400">
              You can also email straight from a row on the Customers page.
            </p>
          </div>
        </Card>
      </div>

      {/* Outbound history */}
      <Card>
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Outbound history{" "}
            {messages && messages.length > 0 && (
              <span className="text-slate-400 normal-case font-normal">— {messages.length} email{messages.length === 1 ? "" : "s"}</span>
            )}
          </h2>
        </div>
        {messages === null ? (
          <div className="p-5">
            <SkeletonRows count={4} withAvatar={false} />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="Nothing sent yet"
            description="One-off emails you send to this affiliate's customers will be logged here."
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {messages.map((m) => (
              <div key={m.id} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs text-slate-700 font-medium truncate">
                    {m.subject}
                    <span className="text-slate-400 font-normal"> → {customerName(m)}</span>
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {m.created_at ? new Date(m.created_at).toLocaleString() : ""}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 whitespace-pre-wrap break-words mt-1 line-clamp-3">{m.body}</p>
                {m.sender && <p className="text-[10px] text-slate-400 mt-1">sent by {m.sender.username}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {emailTarget && (
        <EmailCustomerModal
          instanceId={id}
          customer={emailTarget}
          onClose={() => setEmailTarget(null)}
          onSent={refreshMessages}
        />
      )}
    </div>
  );
}
