import { apiClient } from "@shared/api/apiClient";

// Uses /admin/templates — see API_DOCUMENTATION.md section 15.

export type TemplateType = "event" | "broadcast";
export type TemplateEvent = "login" | "register" | "purchase" | "wallet_credit" | "wallet_debit";
export type TemplateChannel = "email" | "sms" | "in_app" | "push";

export type Template = {
  id: number;
  name: string;
  slug: string;
  type: TemplateType;
  event: TemplateEvent | null;
  subject: string | null;
  content: string;
  channels: TemplateChannel[];
  enabled: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
};

export type TemplatePayload = {
  name: string;
  slug?: string;
  type: TemplateType;
  event?: TemplateEvent | null;
  subject?: string | null;
  content: string;
  channels?: TemplateChannel[];
  enabled?: boolean;
};

export type TemplateFilters = {
  type?: TemplateType;
  event?: TemplateEvent;
  enabled?: boolean;
};

type TemplateEnvelope<T> = { success: boolean; message?: string; data: T };

const BASE = "/admin/templates";

export const templateService = {
  getAll: (filters?: TemplateFilters): Promise<Template[]> =>
    apiClient
      .get<{ data: TemplateEnvelope<Template[]>}>(BASE, { params: filters })
      .then((r) => r.data.data.data ?? []),

  getById: (id: string | number): Promise<Template> =>
    apiClient.get<{ data: TemplateEnvelope<Template> }>(`${BASE}/${id}`).then((r) => r.data.data.data),

  create: (payload: TemplatePayload): Promise<Template> =>
    apiClient.post<{ data: TemplateEnvelope<Template> }>(BASE, payload).then((r) => r.data.data.data),

  update: (id: string | number, payload: Partial<TemplatePayload>): Promise<Template> =>
    apiClient.put<{ data: TemplateEnvelope<Template> }>(`${BASE}/${id}`, payload).then((r) => r.data.data.data),

  remove: (id: string | number): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`).then(() => undefined),
};
