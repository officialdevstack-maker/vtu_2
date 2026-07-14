import Cookies from "js-cookie";
import { apiClient, getAuthToken } from "@shared/api/apiClient";

// Payload sits one `.data` deep in the backend envelope (see HttpResponse).
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type StreamHandlers = {
  onToken?: (text: string) => void;
  onTools?: (tools: string[]) => void;
  onError?: (message: string) => void;
  onComplete?: (conversation: AiConversation) => void;
};

// Parse one SSE frame ("event: x\ndata: {...}") into its event name + payload.
function parseSseFrame(raw: string): { event: string; data: unknown } | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  try {
    return { event, data: JSON.parse(dataLines.join("\n")) };
  } catch {
    return null;
  }
}

export type AiMessageRole = "system" | "user" | "assistant";

export type AiMessage = {
  id: number;
  role: AiMessageRole;
  content: string;
  // Tool names the assistant called on this step (for the activity line).
  tools?: string[];
  created_at: string | null;
};

export type AiProposalStatus =
  | "pending"
  | "executing"
  | "executed"
  | "failed"
  | "rejected";

export type AiProposal = {
  id: number;
  conversation_id: number;
  tool: string;
  permission: string | null;
  summary: string | null;
  arguments: Record<string, unknown>;
  status: AiProposalStatus;
  result: Record<string, unknown> | null;
  error: string | null;
  decided_at: string | null;
  executed_at: string | null;
  created_at: string | null;
};

export type AiConversationSummary = {
  id: number;
  title: string | null;
  last_activity_at: string | null;
  created_at: string | null;
};

export type AiConversation = {
  id: number;
  title: string | null;
  last_activity_at: string | null;
  messages: AiMessage[];
  proposals: AiProposal[];
};

export type AiAlert = {
  id: number;
  severity: "warning" | "critical";
  title: string;
  created_at: string | null;
  updated_at: string | null;
};

// Platform-wide daily AI usage against the configured cap (0/unlimited = no
// cap). Drives the "N of M today" chip and the limit-reached message.
export type AiUsage = {
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
  resets_at: string;
};

const BASE = "/admin/ai";

export const aiManagerService = {
  getUsage: (): Promise<AiUsage> =>
    apiClient.get<ApiEnvelope<AiUsage>>(`${BASE}/usage`).then((r) => r.data.data),

  listConversations: (): Promise<AiConversationSummary[]> =>
    apiClient
      .get<ApiEnvelope<AiConversationSummary[]>>(`${BASE}/conversations`)
      .then((r) => r.data.data),

  getConversation: (id: number): Promise<AiConversation> =>
    apiClient
      .get<ApiEnvelope<AiConversation>>(`${BASE}/conversations/${id}`)
      .then((r) => r.data.data),

  createConversation: (message?: string): Promise<AiConversation> =>
    apiClient
      .post<ApiEnvelope<AiConversation>>(`${BASE}/conversations`, { message })
      .then((r) => r.data.data),

  sendMessage: (id: number, message: string): Promise<AiConversation> =>
    apiClient
      .post<ApiEnvelope<AiConversation>>(
        `${BASE}/conversations/${id}/messages`,
        { message },
      )
      .then((r) => r.data.data),

  // Streaming send over SSE (fetch, since axios can't stream a body in the
  // browser). Reuses the same cookie/token/XSRF auth as apiClient. Callers
  // should fall back to sendMessage() if this throws.
  streamMessage: async (
    id: number,
    message: string,
    handlers: StreamHandlers,
    signal?: AbortSignal,
  ): Promise<void> => {
    const token = getAuthToken();
    const xsrf = Cookies.get("XSRF-TOKEN");
    const res = await fetch(
      `${apiClient.defaults.baseURL ?? "/api"}/admin/ai/conversations/${id}/stream`,
      {
        method: "POST",
        credentials: "include",
        signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "X-Requested-With": "XMLHttpRequest",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(xsrf ? { "X-XSRF-TOKEN": decodeURIComponent(xsrf) } : {}),
        },
        body: JSON.stringify({ message }),
      },
    );

    if (!res.ok || !res.body) {
      throw new Error(`Stream failed (${res.status})`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const frame = parseSseFrame(buffer.slice(0, sep));
        buffer = buffer.slice(sep + 2);
        if (!frame) continue;

        switch (frame.event) {
          case "token":
            handlers.onToken?.((frame.data as { text?: string }).text ?? "");
            break;
          case "tools":
            handlers.onTools?.((frame.data as { tools?: string[] }).tools ?? []);
            break;
          case "error":
            handlers.onError?.(
              (frame.data as { message?: string }).message ?? "Stream error.",
            );
            break;
          case "complete":
            handlers.onComplete?.(frame.data as AiConversation);
            break;
        }
      }
    }
  },

  deleteConversation: (id: number): Promise<void> =>
    apiClient
      .delete<ApiEnvelope<unknown>>(`${BASE}/conversations/${id}`)
      .then(() => undefined),

  approveAction: (id: number): Promise<AiProposal> =>
    apiClient
      .post<ApiEnvelope<AiProposal>>(`${BASE}/actions/${id}/approve`)
      .then((r) => r.data.data),

  rejectAction: (id: number): Promise<AiProposal> =>
    apiClient
      .post<ApiEnvelope<AiProposal>>(`${BASE}/actions/${id}/reject`)
      .then((r) => r.data.data),

  // Proactive monitoring alerts written by the backend AiMonitor middleware.
  listAlerts: (): Promise<AiAlert[]> =>
    apiClient
      .get<ApiEnvelope<AiAlert[]>>(`${BASE}/alerts`)
      .then((r) => r.data.data),

  acknowledgeAlert: (id: number): Promise<void> =>
    apiClient
      .post<ApiEnvelope<unknown>>(`${BASE}/alerts/${id}/acknowledge`)
      .then(() => undefined),

  acknowledgeAllAlerts: (): Promise<void> =>
    apiClient
      .post<ApiEnvelope<unknown>>(`${BASE}/alerts/acknowledge-all`)
      .then(() => undefined),
};
