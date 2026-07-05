import { apiClient } from "@shared/api/apiClient";

// The real payload sits exactly one `.data` deep: r.data.data (see
// backend/app/Http/Middleware/HandleRequest.php). This same row is also what
// every response's `meta.app` block mirrors, since HandleRequest::share()
// reads it straight off App\Models\General.
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type GeneralSettings = {
  id: number;
  app_name: string | null;
  app_phone: string | null;
  app_address: string | null;
  app_email: string | null;
  bvn: string | null;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  logo: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  // Server-computed from .env — read-only here, not real columns.
  app_type: string;
  app_url: string;
  app_logo: string;
};

export type GeneralSettingsPayload = {
  app_name: string;
  app_phone: string | null;
  app_address: string | null;
  app_email: string;
  bvn: string | null;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  logo: string | null;
};

// Uses the Universal Table API against Eloquent's default table name for
// App\Models\General ("generals") — there is exactly one row, id 1.
const BASE = "/table/generals";

export const generalService = {
  get: (): Promise<GeneralSettings> =>
    apiClient
      .get<ApiEnvelope<GeneralSettings>>(`${BASE}/1`)
      .then((r) => r.data.data),

  update: (payload: GeneralSettingsPayload): Promise<GeneralSettings> =>
    apiClient
      .put<ApiEnvelope<GeneralSettings>>(`${BASE}/1`, payload)
      .then((r) => r.data.data),
};
