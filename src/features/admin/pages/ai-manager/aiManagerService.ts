import { apiClient } from "@shared/api/apiClient";

// Payload sits one `.data` deep in the backend envelope (see HttpResponse).
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type AiMessageRole = "system" | "user" | "assistant";

export type AiMessage = {
  id: number;
  role: AiMessageRole;
  content: string;
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

const BASE = "/admin/ai";

export const aiManagerService = {
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
