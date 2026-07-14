import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  Check,
  Clock3,
  Loader2,
  MessageSquarePlus,
  PanelLeft,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { isAxiosError } from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  aiManagerService,
  type AiConversation,
  type AiConversationSummary,
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

const relativeTime = (iso: string | null) => {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMin = Math.floor((Date.now() - then) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const STATUS_STYLES: Record<AiProposal["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  executing: "bg-blue-50 text-blue-700 border-blue-200",
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Keep the thread pinned to the latest turn.
  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [active?.messages.length, active?.proposals.length, sendMutation.isPending]);

  // Grow the composer with its content, up to a cap.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

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

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setDraft("");
    setDrawerOpen(false);
    sendMutation.reset();
    textareaRef.current?.focus();
  }, [sendMutation]);

  const openConversation = useCallback((id: number) => {
    setActiveId(id);
    setDrawerOpen(false);
  }, []);

  const conversations = conversationsQuery.data ?? [];

  const list = (
    <ConversationList
      conversations={conversations}
      activeId={activeId}
      loading={conversationsQuery.isLoading}
      onSelect={openConversation}
      onNewChat={startNewChat}
      onDelete={(id) => deleteMutation.mutate(id)}
      deletingId={
        deleteMutation.isPending ? (deleteMutation.variables ?? null) : null
      }
    />
  );

  return (
    <div className="flex h-[calc(100dvh-88px)] gap-4 sm:h-[calc(100dvh-104px)]">
      {/* Desktop conversation list */}
      <aside className="hidden w-72 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white lg:flex">
        {list}
      </aside>

      {/* Mobile conversation drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative flex h-full w-[min(20rem,86vw)] flex-col bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3.5 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close conversations"
            >
              <X className="h-4 w-4" />
            </button>
            {list}
          </aside>
        </div>
      ) : null}

      {/* Chat panel */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <header className="flex items-center gap-2 border-b border-slate-100 px-3 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:hidden"
            aria-label="Open conversations"
          >
            <PanelLeft className="h-5 w-5" />
          </button>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#111827]/10 text-[#111827]">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-slate-900">
              {active?.title ?? "AI Manager"}
            </h1>
            <p className="hidden truncate text-xs text-slate-400 sm:block">
              Monitors the site &amp; proposes admin actions for your approval
            </p>
          </div>

          <button
            type="button"
            onClick={startNewChat}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-[#111827] px-3 text-xs font-medium text-white transition-colors hover:bg-[#111827]/90"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </header>

        <div
          ref={threadRef}
          className="flex-1 space-y-4 overflow-y-auto px-3 py-5 sm:px-6 [scrollbar-width:thin]"
        >
          {!active || active.messages.length === 0 ? (
            <EmptyState onPick={submit} disabled={sendMutation.isPending} />
          ) : (
            active.messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}

          {sendMutation.isPending && <TypingIndicator />}

          {sendMutation.isError && (
            <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage(
                sendMutation.error,
                "Something went wrong talking to the assistant.",
              )}
            </div>
          )}

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
        <div className="border-t border-slate-100 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(draft);
            }}
            className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition-colors focus-within:border-[#111827]/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#111827]/10"
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(draft);
                }
              }}
              rows={1}
              placeholder="Ask about transactions, users, vendors…"
              className="max-h-40 min-h-[2.25rem] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sendMutation.isPending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#111827] text-white transition-all hover:bg-[#111827]/90 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Send"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl px-1 text-center text-[11px] text-slate-400 sm:text-left">
            Data-changing actions are never run automatically — the assistant
            proposes them and you approve each one.
          </p>
        </div>
      </section>
    </div>
  );
};

const ConversationList = ({
  conversations,
  activeId,
  loading,
  onSelect,
  onNewChat,
  onDelete,
  deletingId,
}: {
  conversations: AiConversationSummary[];
  activeId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
  onNewChat: () => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
}) => {
  const [confirmId, setConfirmId] = useState<number | null>(null);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="border-b border-slate-100 p-3">
        <p className="px-1 pb-3 pt-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Conversations
        </p>
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#111827]/90"
        >
          <MessageSquarePlus className="h-4 w-4" /> New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
        {loading ? (
          <div className="space-y-1.5 p-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-11 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : conversations.length ? (
          conversations.map((c) => {
            const isActive = activeId === c.id;
            const isConfirming = confirmId === c.id;
            return (
              <div
                key={c.id}
                className={`group mb-1 flex items-center rounded-xl transition-colors ${
                  isActive ? "bg-[#111827]/10" : "hover:bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="min-w-0 flex-1 px-3 py-2.5 text-left"
                >
                  <p
                    className={`truncate text-sm ${
                      isActive
                        ? "font-semibold text-[#111827]"
                        : "font-medium text-slate-700"
                    }`}
                  >
                    {c.title ?? "Untitled"}
                  </p>
                  {relativeTime(c.last_activity_at ?? c.created_at) && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock3 className="h-3 w-3" />
                      {relativeTime(c.last_activity_at ?? c.created_at)}
                    </p>
                  )}
                </button>

                {isConfirming ? (
                  <div className="flex items-center gap-0.5 pr-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(c.id);
                        setConfirmId(null);
                      }}
                      className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                      aria-label="Confirm delete"
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
                      aria-label="Cancel delete"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(c.id)}
                    className="mr-1.5 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-slate-100 hover:text-red-500 lg:opacity-0 lg:group-hover:opacity-100"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center px-3 py-10 text-center">
            <Bot className="h-6 w-6 text-slate-300" />
            <p className="mt-2 text-xs text-slate-400">No conversations yet.</p>
          </div>
        )}
      </div>
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
  <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center py-8 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111827]/10 text-[#111827]">
      <Sparkles className="h-7 w-7" />
    </div>
    <h2 className="mt-4 text-lg font-semibold text-slate-900">
      How can I help you manage the site?
    </h2>
    <p className="mt-1 max-w-sm text-sm text-slate-500">
      I can look up live data and propose actions for your approval.
    </p>
    <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s)}
          className="group flex items-start gap-2 rounded-xl border border-slate-200 px-3.5 py-3 text-left text-sm text-slate-600 transition-colors hover:border-[#111827]/30 hover:bg-slate-50 disabled:opacity-50"
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#111827]" />
          <span>{s}</span>
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
    <div
      className={`mx-auto flex max-w-3xl gap-2.5 sm:gap-3 ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
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
        className={`max-w-[85%] break-words rounded-2xl px-4 py-2.5 text-sm sm:max-w-[80%] ${
          isUser
            ? "whitespace-pre-wrap rounded-tr-sm bg-[#111827] text-white"
            : "rounded-tl-sm bg-slate-100 text-slate-800"
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <MarkdownMessage content={message.content ?? ""} />
        )}
      </div>
    </div>
  );
};

// Renders assistant replies as Markdown (bold, lists, tables, code, links) so
// responses read like a real AI chat rather than raw text with literal
// asterisks. Each element is Tailwind-styled to sit on the slate-100 bubble;
// wide tables/code scroll inside their own box instead of stretching the page.
const MarkdownMessage = ({ content }: { content: string }) => (
  <div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ node: _n, ...p }) => <p className="my-2" {...p} />,
        ul: ({ node: _n, ...p }) => <ul className="my-2 list-disc space-y-1 pl-5" {...p} />,
        ol: ({ node: _n, ...p }) => <ol className="my-2 list-decimal space-y-1 pl-5" {...p} />,
        li: ({ node: _n, ...p }) => <li className="marker:text-slate-400" {...p} />,
        strong: ({ node: _n, ...p }) => <strong className="font-semibold text-slate-900" {...p} />,
        em: ({ node: _n, ...p }) => <em className="italic" {...p} />,
        a: ({ node: _n, ...p }) => (
          <a
            className="font-medium text-[#111827] underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
            {...p}
          />
        ),
        h1: ({ node: _n, ...p }) => <h1 className="mb-2 mt-3 text-base font-semibold text-slate-900" {...p} />,
        h2: ({ node: _n, ...p }) => <h2 className="mb-2 mt-3 text-sm font-semibold text-slate-900" {...p} />,
        h3: ({ node: _n, ...p }) => <h3 className="mb-1.5 mt-2.5 text-sm font-semibold text-slate-800" {...p} />,
        blockquote: ({ node: _n, ...p }) => (
          <blockquote className="my-2 border-l-2 border-slate-300 pl-3 text-slate-600" {...p} />
        ),
        hr: ({ node: _n, ...p }) => <hr className="my-3 border-slate-200" {...p} />,
        code: ({ node: _n, className, children, ...p }) => {
          const isBlock = /language-/.test(className ?? "");
          return isBlock ? (
            <code
              className="block overflow-x-auto rounded-lg bg-slate-900/90 p-3 font-mono text-xs leading-relaxed text-slate-100"
              {...p}
            >
              {children}
            </code>
          ) : (
            <code
              className="rounded bg-slate-200/80 px-1 py-0.5 font-mono text-[0.85em] text-slate-800"
              {...p}
            >
              {children}
            </code>
          );
        },
        pre: ({ node: _n, ...p }) => <pre className="my-2" {...p} />,
        table: ({ node: _n, ...p }) => (
          <div className="my-2 overflow-x-auto">
            <table className="w-full border-collapse text-xs" {...p} />
          </div>
        ),
        thead: ({ node: _n, ...p }) => <thead className="border-b border-slate-300" {...p} />,
        th: ({ node: _n, ...p }) => <th className="px-2 py-1.5 text-left font-semibold text-slate-700" {...p} />,
        td: ({ node: _n, ...p }) => <td className="border-t border-slate-200 px-2 py-1.5 align-top" {...p} />,
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

const TypingIndicator = () => (
  <div className="mx-auto flex max-w-3xl gap-2.5 sm:gap-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111827]/10 text-[#111827]">
      <Bot className="h-4 w-4" />
    </div>
    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
);

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
  <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60">
    <div className="flex items-center gap-2 border-b border-amber-200/70 bg-amber-100/50 px-4 py-2">
      <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
        Action needs your approval
      </p>
    </div>
    <div className="p-4">
      <p className="text-sm font-medium text-slate-800">
        {proposal.summary ?? proposal.tool}
      </p>
      <ArgList args={proposal.arguments} />
      {error && (
        <p className="mt-3 rounded-lg bg-red-100 px-2.5 py-1.5 text-xs text-red-700">
          {error}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 sm:flex-none sm:py-2"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Approve &amp; run
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 sm:flex-none sm:py-2"
        >
          <X className="h-4 w-4" /> Reject
        </button>
      </div>
    </div>
  </div>
);

const DecidedProposal = ({ proposal }: { proposal: AiProposal }) => (
  <div className="mx-auto flex max-w-3xl items-center gap-2 pl-1 text-xs">
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 font-medium capitalize ${STATUS_STYLES[proposal.status]}`}
    >
      {proposal.status}
    </span>
    <span className="min-w-0 truncate text-slate-500">
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
    <dl className="mt-3 grid grid-cols-[minmax(0,auto)_1fr] gap-x-3 gap-y-1 rounded-lg bg-white/60 p-2.5 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="truncate text-slate-400">{key}</dt>
          <dd className="truncate font-medium text-slate-600">
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
