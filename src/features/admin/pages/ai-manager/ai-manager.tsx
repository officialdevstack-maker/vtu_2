import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Activity,
  Bot,
  Check,
  Clock3,
  FileCheck2,
  History,
  Loader2,
  MessageSquareText,
  Menu,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { isAxiosError } from "axios";
import { Button, Card, PageHeader } from "../../../user/components/shared-ui";
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

/**
 * Markdown-lite renderer for assistant replies. The AI service answers with
 * **bold**, "- " bullets, and "1. " numbered lines — a full markdown library
 * is overkill for that, so this renders exactly those three constructs and
 * leaves everything else as plain text.
 */
const renderInline = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );

const Markdown = ({ text }: { text: string }) => {
  const blocks: { list: boolean; lines: string[] }[] = [];
  for (const line of text.split("\n")) {
    const isItem = /^\s*(-|\d+\.)\s+/.test(line);
    const last = blocks[blocks.length - 1];
    if (last && last.list === isItem) last.lines.push(line);
    else blocks.push({ list: isItem, lines: [line] });
  }
  return (
    <div className="space-y-1.5">
      {blocks.map((block, i) =>
        block.list ? (
          <ul key={i} className="space-y-1">
            {block.lines.map((line, j) => {
              const marker = line.match(/^\s*(-|\d+\.)\s+/)?.[1] ?? "-";
              return (
                <li
                  key={j}
                  className="flex gap-1.5"
                  style={{
                    paddingLeft: `${(line.match(/^\s*/)?.[0].length ?? 0) * 0.4}rem`,
                  }}
                >
                  <span className="shrink-0 text-slate-400">
                    {marker === "-" ? "•" : marker}
                  </span>
                  <span className="min-w-0">
                    {renderInline(line.replace(/^\s*(-|\d+\.)\s+/, ""))}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          block.lines.join("\n").trim() && (
            <p key={i} className="whitespace-pre-wrap">
              {renderInline(block.lines.join("\n"))}
            </p>
          )
        ),
      )}
    </div>
  );
};

const STATUS_STYLES: Record<AiProposal["status"], string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  executing: "bg-blue-50 text-blue-700 border-blue-200",
  executed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-slate-100 text-slate-500 border-slate-200",
};

const SUGGESTIONS = [
  {
    title: "Health check",
    prompt: "Run a health check on the platform",
    description: "Find vendor, transaction, SIM, and affiliate issues.",
    icon: Activity,
  },
  {
    title: "Today overview",
    prompt: "How is the site doing today?",
    description: "Summarise operations with exact figures.",
    icon: Sparkles,
  },
  {
    title: "Failed transactions",
    prompt: "Show me the last 10 failed transactions",
    description: "Inspect recent failures and likely causes.",
    icon: AlertTriangle,
  },
  {
    title: "Customer lookup",
    prompt: "Investigate the customer jane@example.com",
    description: "Pull customer profile, wallet, and transaction context.",
    icon: UserIcon,
  },
];

const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString() : "No activity yet";

const AiManagerPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
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
  const conversations = conversationsQuery.data ?? [];

  const refreshConversation = (data: AiConversation) => {
    queryClient.setQueryData(["ai", "conversation", data.id], data);
    queryClient.invalidateQueries({ queryKey: ["ai", "conversations"] });
  };

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const content = message.trim();
      if (activeId === null) {
        return aiManagerService.createConversation(
          content.length > 0 ? content : undefined,
        );
      }
      return aiManagerService.sendMessage(activeId, content);
    },
    onSuccess: (data) => {
      setActiveId(data.id);
      refreshConversation(data);
      if (conversationId === "new") {
        navigate(`/admin/ai-manager/chat/${data.id}`, { replace: true });
      }
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

  useEffect(() => {
    if (window.location.pathname === "/admin/ai-manager") {
      navigate("/admin/ai-manager/chat/new", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!conversationId || conversationId === "new") {
      setActiveId(null);
      return;
    }

    const id = Number(conversationId);
    if (!Number.isNaN(id)) {
      setActiveId(id);
    }
  }, [conversationId]);

  // Arriving via "Ask AI to fix" on a monitoring alert (?ask=...): start a
  // fresh conversation with that message immediately, then drop the param so
  // refreshes/back-navigation don't re-send it.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const ask = searchParams.get("ask");
    if (ask && !sendMutation.isPending) {
      setSearchParams({}, { replace: true });
      setActiveId(null);
      sendMutation.mutate(ask);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
    setHistoryOpen(false);
    sendMutation.reset();
    navigate("/admin/ai-manager/chat/new");
  };

  const openConversation = (id: number) => {
    setHistoryOpen(false);
    navigate(`/admin/ai-manager/chat/${id}`);
  };

  const messageCount = active?.messages.length ?? 0;
  const totalProposals = active?.proposals.length ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title={
          <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
            AI Manager
            <span className="rounded-full border border-[#111827]/15 bg-[#111827]/10 px-2 py-0.5 text-xs font-medium text-[#111827]">
              Approval-safe
            </span>
          </span>
        }
        description="Monitor the platform, investigate live data, and queue admin actions for approval."
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              className="lg:hidden"
              onClick={() => setHistoryOpen(true)}
            >
              <Menu className="h-3.5 w-3.5" /> History
            </Button>
            <Button size="sm" onClick={startNewChat}>
              <Plus className="h-3.5 w-3.5" /> New chat
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          icon={History}
          label="Conversations"
          value={String(conversations.length)}
          tone="neutral"
        />
        <MiniStat
          icon={MessageSquareText}
          label="Thread messages"
          value={String(messageCount)}
          tone="neutral"
        />
        <MiniStat
          icon={ShieldAlert}
          label="Pending approvals"
          value={String(pendingProposals.length)}
          tone={pendingProposals.length > 0 ? "warning" : "success"}
        />
        <MiniStat
          icon={FileCheck2}
          label="Action records"
          value={String(totalProposals)}
          tone="success"
        />
      </div>

      {historyOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/30 p-3 backdrop-blur-sm lg:hidden">
          <div className="mx-auto h-full w-full max-w-sm">
            <ConversationSidebar
              activeId={activeId}
              conversations={conversations}
              loading={conversationsQuery.isPending}
              onClose={() => setHistoryOpen(false)}
              onNew={startNewChat}
              onOpen={openConversation}
              onDelete={(id) => deleteMutation.mutate(id)}
              deletingId={deleteMutation.variables}
            />
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="grid h-[70vh] min-h-[30rem] sm:h-[75vh] sm:min-h-[34rem] lg:h-[calc(100vh-17rem)] lg:min-h-[42rem] lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="hidden min-h-0 border-r border-slate-100 lg:block">
            <ConversationSidebar
              activeId={activeId}
              conversations={conversations}
              loading={conversationsQuery.isPending}
              onNew={startNewChat}
              onOpen={openConversation}
              onDelete={(id) => deleteMutation.mutate(id)}
              deletingId={deleteMutation.variables}
            />
          </div>

          {/* Chat panel */}
          <section className="flex min-h-0 min-w-0 flex-col bg-white">
            <header className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#111827]/10 text-[#111827]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-slate-900">
                    {active?.title ?? "New AI workspace"}
                  </h2>
                  <p className="truncate text-xs text-slate-400">
                    Read-only tools run immediately. Mutating tools become
                    approval cards.
                  </p>
                </div>
                <div className="ml-auto hidden items-center gap-2 sm:flex">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> Guarded actions
                  </span>
                </div>
              </div>
            </header>

            <div
              ref={threadRef}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/60 px-3 py-4 sm:px-5"
            >
              {!active || active.messages.length === 0 ? (
                <EmptyState onPick={submit} disabled={sendMutation.isPending} />
              ) : (
                active.messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))
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
                    (rejectMutation.isPending &&
                      rejectMutation.variables === p.id)
                  }
                  error={
                    approveMutation.isError &&
                    approveMutation.variables === p.id
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
            <div className="border-t border-slate-100 bg-white p-3 sm:p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(draft);
                }}
                className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition-colors focus-within:border-[#111827]/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-[#111827]/10"
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
                  className="max-h-40 min-h-[2.75rem] flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
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
                Actions that change data need approval. Reply "approve",
                "approve #ID", or use the buttons to run one.
              </p>
            </div>
          </section>
        </div>
      </Card>
    </div>
  );
};

type MiniStatTone = "neutral" | "success" | "warning";

const MINI_STAT_TONES: Record<MiniStatTone, string> = {
  neutral: "bg-[#111827]/10 text-[#111827]",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
};

const MiniStat = ({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Bot;
  label: string;
  value: string;
  tone: MiniStatTone;
}) => (
  <Card className="p-3.5">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
          {value}
        </p>
      </div>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${MINI_STAT_TONES[tone]}`}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
    </div>
  </Card>
);

const ConversationSidebar = ({
  activeId,
  conversations,
  loading,
  onClose,
  onNew,
  onOpen,
  onDelete,
  deletingId,
}: {
  activeId: number | null;
  conversations: AiConversationSummary[];
  loading: boolean;
  onClose?: () => void;
  onNew: () => void;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  deletingId?: number;
}) => (
  <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111827] font-normal text-white shadow-xl lg:rounded-none lg:border-0 lg:shadow-none">
    <div className="border-b border-white/10 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-white/35">
            AI threads
          </p>
          <h3 className="truncate text-sm text-white">Conversation history</h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/45 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close history"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onNew}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs text-[#111827] transition-colors hover:bg-white/90"
      >
        <Plus className="h-3.5 w-3.5" /> New chat
      </button>
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {loading ? (
        <div className="space-y-2 p-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-slate-100 bg-slate-50"
            />
          ))}
        </div>
      ) : conversations.length ? (
        conversations.map((c) => {
          const isActive = activeId === c.id;
          return (
            <div
              key={c.id}
              className={`group mb-1.5 flex items-center rounded-xl border transition-colors ${
                isActive
                  ? "border-white/10 bg-white/10"
                  : "border-transparent hover:border-white/10 hover:bg-white/5"
              }`}
            >
              <button
                type="button"
                onClick={() => onOpen(c.id)}
                className="min-w-0 flex-1 px-3 py-3 text-left"
              >
                <p className="truncate text-sm text-white">
                  {c.title ?? "Untitled conversation"}
                </p>
                <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-white/40">
                  <Clock3 className="h-3.5 w-3.5 shrink-0" />
                  {formatDateTime(c.last_activity_at)}
                </p>
              </button>
              <button
                type="button"
                onClick={() => onDelete(c.id)}
                disabled={deletingId === c.id}
                className="mr-1 rounded-lg p-2 text-white/25 opacity-100 transition-colors hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Delete conversation"
              >
                {deletingId === c.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          );
        })
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center">
          <MessageSquareText className="mx-auto h-5 w-5 text-white/25" />
          <p className="mt-2 text-xs text-white/50">No conversations yet.</p>
        </div>
      )}
    </div>
  </aside>
);

const EmptyState = ({
  onPick,
  disabled,
}: {
  onPick: (text: string) => void;
  disabled: boolean;
}) => (
  <div className="mx-auto flex max-w-3xl flex-col items-center py-6 text-center sm:py-10">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111827] text-white shadow-lg shadow-[#111827]/20">
      <Sparkles className="h-7 w-7" />
    </div>
    <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
      Manage operations with live context
    </h2>
    <p className="mt-1 max-w-xl text-sm text-slate-500">
      Ask for health checks, customer investigations, transaction reviews, or
      draft actions. Any change to platform data stays pending until you approve
      it.
    </p>
    <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
      {SUGGESTIONS.map((s) => (
        <button
          key={s.prompt}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s.prompt)}
          className="group rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition-colors hover:border-[#111827]/30 hover:bg-slate-50 disabled:opacity-50"
        >
          <span className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#111827]/10 text-[#111827] transition-colors group-hover:bg-[#111827] group-hover:text-white">
              <s.icon className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-800">
                {s.title}
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                {s.description}
              </span>
            </span>
          </span>
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
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
          isUser
            ? "bg-[#111827] text-white"
            : "border border-slate-200 bg-white text-[#111827]"
        }`}
      >
        {isUser ? (
          <UserIcon className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div
        className={`max-w-[min(44rem,100%)] overflow-hidden rounded-2xl px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:max-w-[min(44rem,85%)] ${
          isUser
            ? "whitespace-pre-wrap bg-[#111827] text-white"
            : "border border-slate-200 bg-white text-slate-800"
        }`}
      >
        {isUser ? message.content : <Markdown text={message.content ?? ""} />}
        {message.created_at && (
          <div
            className={`mt-1 text-[11px] ${
              isUser ? "text-slate-200 text-right" : "text-slate-400 text-left"
            }`}
          >
            {new Date(message.created_at).toLocaleString()}
          </div>
        )}
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
  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
        <ShieldAlert className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Action needs your approval
          </p>
          <span className="rounded-full border border-amber-200 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            #{proposal.id}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          {proposal.summary ?? proposal.tool}
        </p>
        <p className="mt-1 text-xs leading-5 text-amber-800/80">
          This has not run yet. Review the payload before approving.
        </p>
        <ArgList args={proposal.arguments} />
        {error && (
          <p className="mt-2 rounded-lg bg-red-100 px-2.5 py-1.5 text-xs text-red-700">
            {error}
          </p>
        )}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onApprove}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
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
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" /> Reject
          </button>
        </div>
      </div>
    </div>
  </div>
);

const DecidedProposal = ({ proposal }: { proposal: AiProposal }) => (
  <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs">
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
    <dl className="mt-3 grid grid-cols-1 gap-1.5 rounded-xl border border-amber-100 bg-white/70 p-3 text-xs sm:grid-cols-[auto_1fr]">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="font-medium text-slate-400">{key}</dt>
          <dd className="min-w-0 break-words font-mono text-slate-600">
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default AiManagerPage;
