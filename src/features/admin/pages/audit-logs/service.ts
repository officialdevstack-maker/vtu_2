import { apiClient } from "@shared/api/apiClient";

// Laravel's HttpResponse wrapper puts the payload one `.data` deep.
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

/** One field's before/after. `old` is absent on create/delete snapshots. */
export type AuditChange = { old?: unknown; new?: unknown };

export type AuditLog = {
  id: number;
  action: string;
  description: string | null;
  subject_type: string | null;
  subject_id: number | null;
  subject_label: string | null;
  // Either {field: {old, new}} for updates, or a flat attribute snapshot for
  // create/delete. The UI renders both shapes.
  changes: Record<string, AuditChange | unknown> | null;
  context: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
  actor: { id: number | null; name: string; email: string | null };
};

export type AuditLogPage = {
  data: AuditLog[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
};

export type AuditLogQuery = {
  action?: string;
  user_id?: string;
  subject_type?: string;
  date_from?: string;
  date_to?: string;
  q?: string;
  page?: number;
  per_page?: number;
};

export type AuditFilters = {
  actions: string[];
  subject_types: string[];
  actors: { id: number; name: string | null }[];
};

/** Drop blank values so they don't become `?action=` in the request. */
function clean(query: AuditLogQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== "" && value !== undefined && value !== null) out[key] = value;
  }
  return out;
}

export const auditLogService = {
  list: (query: AuditLogQuery): Promise<AuditLogPage> =>
    apiClient
      .get<ApiEnvelope<AuditLogPage>>("/admin/audit-logs", { params: clean(query) })
      .then((r) => r.data.data),

  filters: (): Promise<AuditFilters> =>
    apiClient
      .get<ApiEnvelope<AuditFilters>>("/admin/audit-logs/filters")
      .then((r) => r.data.data),
};
