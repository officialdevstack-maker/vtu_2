import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Check,
  Loader2,
  Plus,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { isAxiosError } from "axios";
import {
  aiManagerService,
  type AiConversation,
  type AiProposal,
} from "./aiManagerService";

const errorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message ??
      fallback
    );
  }
  return fallback;
};

const STATUS_STYLES: Record<AiProposal["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  executed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-slate-100 text-slate-500 border-slate-200",
};

const SUGGESTIONS = [
  "How is the site doing today?",
  "Show me the last 10 failed transactions",
  "Which vendors are below their auto-fund threshold?",
  "Find the customer with email jane@example.com",
];

const AiManagerPage = () => {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useQuery({
    queryKey: ["ai", "conversations"],
    queryFn: () => aiManagerService.listConversations(),
  });

  const conversationQuery = useQuery({
    queryKey: ["ai", "conversation", activeId],
    queryFn: () => aiManagerService.getConversation(activeId as number),
    enabled: activeId !== null,
  });

  const active = conversationQuery.data;

  const refreshConversation = (data: AiConversation) => {
    queryClient.setQueryData(["ai", "conversation", data.id], data);
    queryClient.invalidateQueries({ queryKey: ["ai", "conversations"] });
  };

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      if (activeId === null) {
        return aiManagerService.createConversation(message);
      }
      return aiManagerService.sendMessage(activeId, message);
    },
    onSuccess: (data) => {
      setActiveId(data.id);
      refreshConversation(data);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (proposalId: number) =>
      aiManagerService.approveAction(proposalId),
    onSuccess: () => {
      if (activeId !== null) {
        queryClient.invalidateQueries({
          queryKey: ["ai", "conversation", activeId],
        });
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (proposalId: number) =>
      aiManagerService.rejectAction(proposalId),
    onSuccess: () => {
      if (activeId !== null) {
        queryClient.invalidateQueries({
          queryKey: ["ai", "conversation", activeId],
        });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => aiManagerService.deleteConversation(id),
    onSuccess: (_data, id) => {
      if (activeId === id) setActiveId(null);
      queryClient.invalidateQueries({ queryKey: ["ai", "conversations"] });
    },
  });

  // Keep the thread scrolled to the latest turn.
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [active?.messages.length, sendMutation.isPending]);

  const pendingProposals = useMemo(
    () => (active?.proposals ?? []).filter((p) => p.status === "pending"),
    [active?.proposals],
  );
  const decidedProposals = useMemo(
    () => (active?.proposals ?? []).filter((p) => p.status !== "pending"),
    [active?.proposals],
  );

  const submit = (message: string) => {
    const text = message.trim();
    if (!text || sendMutation.isPending) return;
    setDraft("");
    sendMutation.mutate(text);
  };

  const startNewChat = () => {
    setActiveId(null);
    setDraft("");
    sendMutation.reset();
  };

  return (
    <div className="flex h-[calc(100vh-7.5rem)] gap-4">
      {/* Conversation list */}
      <aside className="hidden w-64 shrink-0 flex-col rounded-2xl border border-slate-100 bg-white md:flex">
        <div className="border-b border-slate-100 p-3">
          <button
            type="button"
            onClick={startNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#111827]/90"
          >
            <Plus className="h-4 w-4" /> New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {conversationsQuery.data?.length ? (
            conversationsQuery.data.map((c) => (
              <div
                key={c.id}
                className={`group mb-1 flex items-center rounded-xl transition-colors ${
                  activeId === c.id ? "bg-[#111827]/10" : "hover:bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className="min-w-0 flex-1 px-3 py-2.5 text-left"
                >
                  <p className="truncate text-sm font-medium text-slate-700">
                    {c.title ?? "Untitled"}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(c.id)}
                  className="px-2 text-slate-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-xs text-slate-400">
              No conversations yet.
            </p>
          )}
        </div>
      </aside>

      {/* Chat panel */}
      <section className="flex min-w-0 flex-1 flex-col rounded-2xl border border-slate-100 bg-white">
        <header className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111827]/10 text-[#111827]">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-slate-900">
              {active?.title ?? "AI Manager"}
            </h1>
            <p className="text-xs text-slate-400">
              Monitors the site &amp; proposes admin actions for your approval
            </p>
          </div>
        </header>

        <div
          ref={threadRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6"
        >
          {!active || active.messages.length === 0 ? (
            <EmptyState onPick={submit} disabled={sendMutation.isPending} />
          ) : (
            active.messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}

          {sendMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Bot className="h-4 w-4" />
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          )}

          {sendMutation.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage(
                sendMutation.error,
                "Something went wrong talking to the assistant.",
              )}
            </div>
          )}

          {/* Pending actions awaiting approval */}
          {pendingProposals.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              onApprove={() => approveMutation.mutate(p.id)}
              onReject={() => rejectMutation.mutate(p.id)}
              busy={
                (approveMutation.isPending &&
                  approveMutation.variables === p.id) ||
                (rejectMutation.isPending && rejectMutation.variables === p.id)
              }
              error={
                approveMutation.isError && approveMutation.variables === p.id
                  ? errorMessage(approveMutation.error, "Action failed.")
                  : null
              }
            />
          ))}

          {decidedProposals.map((p) => (
            <DecidedProposal key={p.id} proposal={p} />
          ))}
        </div>

        {/* Composer */}
        <div className="border-t border-slate-100 p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(draft);
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(draft);
                }
              }}
              rows={1}
              placeholder="Ask about transactions, users, vendors — or request an action…"
              className="max-h-40 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-[#111827]/30 focus:bg-white focus:ring-4 focus:ring-[#111827]/10"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sendMutation.isPending}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#111827] text-white transition-colors hover:bg-[#111827]/90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
          <p className="mt-2 px-1 text-[11px] text-slate-400">
            Actions that change data are never executed automatically — the
            assistant proposes them and you approve each one.
          </p>
        </div>
      </section>
    </div>
  );
};

const EmptyState = ({
  onPick,
  disabled,
}: {
  onPick: (text: string) => void;
  disabled: boolean;
}) => (
  <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111827]/10 text-[#111827]">
      <Sparkles className="h-7 w-7" />
    </div>
    <h2 className="mt-4 text-base font-semibold text-slate-900">
      How can I help you manage the site?
    </h2>
    <p className="mt-1 text-sm text-slate-500">
      I can look up live data and propose actions for your approval.
    </p>
    <div className="mt-5 grid w-full gap-2">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s)}
          className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-left text-sm text-slate-600 transition-colors hover:border-[#111827]/30 hover:bg-slate-50 disabled:opacity-50"
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

const MessageBubble = ({
  message,
}: {
  message: AiConversation["messages"][number];
}) => {
  if (message.role === "system") {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
          {message.content}
        </span>
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-[#111827] text-white" : "bg-[#111827]/10 text-[#111827]"
        }`}
      >
        {isUser ? (
          <UserIcon className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-[#111827] text-white"
            : "bg-slate-50 text-slate-800"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
};

const ProposalCard = ({
  proposal,
  onApprove,
  onReject,
  busy,
  error,
}: {
  proposal: AiProposal;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
  error: string | null;
}) => (
  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
    <div className="flex items-start gap-2.5">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
          Action needs your approval
        </p>
        <p className="mt-1 text-sm font-medium text-slate-800">
          {proposal.summary ?? proposal.tool}
        </p>
        <ArgList args={proposal.arguments} />
        {error && (
          <p className="mt-2 rounded-lg bg-red-100 px-2.5 py-1.5 text-xs text-red-700">
            {error}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onApprove}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Approve &amp; run
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" /> Reject
          </button>
        </div>
      </div>
    </div>
  </div>
);

const DecidedProposal = ({ proposal }: { proposal: AiProposal }) => (
  <div className="flex items-center gap-2 pl-1 text-xs">
    <span
      className={`rounded-full border px-2 py-0.5 font-medium capitalize ${STATUS_STYLES[proposal.status]}`}
    >
      {proposal.status}
    </span>
    <span className="truncate text-slate-500">
      {proposal.summary ?? proposal.tool}
      {proposal.status === "failed" && proposal.error
        ? ` — ${proposal.error}`
        : ""}
    </span>
  </div>
);

const ArgList = ({ args }: { args: Record<string, unknown> }) => {
  const entries = Object.entries(args ?? {});
  if (entries.length === 0) return null;
  return (
    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-slate-400">{key}</dt>
          <dd className="truncate text-slate-600">
            {typeof value === "object"
              ? JSON.stringify(value)
              : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default AiManagerPage;
