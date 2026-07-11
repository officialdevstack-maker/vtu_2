import { apiClient } from "@shared/api/apiClient";

// The real payload sits exactly one `.data` deep: r.data.data (see
// backend/app/Http/Middleware/HandleRequest.php).
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// The platform's own SIM fleet — Android agent phones hosting physical SIMs
// that fulfil airtime/data directly (no external provider). Managed under
// its own admin surface, deliberately separate from Provider CRUD; the
// backend routes purchases to it by default and auto-fails-over to API
// providers when no SIM can serve (see backend SIM_VENDING_PROTOCOL.md).

export type SimRow = {
  id: number;
  slot_index: number;
  network: string;
  phone_number: string | null;
  supports_airtime: boolean;
  supports_data: boolean;
  airtime_balance: number | string;
  data_balance_mb: number | string;
  airtime_low_threshold: number | string;
  data_low_threshold_mb: number | string;
  // Whether a transfer PIN is stored (the PIN itself is never sent to the
  // UI — only the hub's signed config endpoint can read it).
  has_pin: boolean;
  balance_ussd: string | null;
  enabled: boolean;
  balance_reported_at: string | null;
  low: boolean;
};

export type SimDevice = {
  id: number;
  name: string;
  slug: string;
  status: "active" | "paused" | "revoked";
  online: boolean;
  last_seen_at: string | null;
  app_version: string | null;
  registered_at: string | null;
  registration_code: string | null;
  registration_code_expires_at: string | null;
  sims: SimRow[];
};

export type SimVendJobStatus = "pending" | "claimed" | "success" | "failed";

export type SimVendJob = {
  id: number;
  reference: string;
  service: string;
  network: string;
  phone: string;
  amount: number | string;
  status: SimVendJobStatus;
  attempts: number;
  device: string | null;
  failure_reason: string | null;
  created_at: string;
  acked_at: string | null;
};

export type SimVendingOverview = {
  enabled: boolean;
  devices: SimDevice[];
  job_counts: Record<SimVendJobStatus, number>;
  recent_jobs: SimVendJob[];
};

export type SimRegistrationCode = {
  id: number;
  name: string;
  registration_code: string;
  expires_at: string;
};

export type SimUpdatePayload = Partial<{
  network: string;
  phone_number: string | null;
  supports_airtime: boolean;
  supports_data: boolean;
  airtime_low_threshold: number;
  data_low_threshold_mb: number;
  transfer_pin: string | null;
  balance_ussd: string | null;
  enabled: boolean;
  notes: string | null;
}>;

export type SimCreatePayload = {
  slot_index: number;
  network: string;
  phone_number?: string | null;
  transfer_pin?: string | null;
  balance_ussd?: string | null;
  supports_airtime?: boolean;
  supports_data?: boolean;
};

const BASE = "/admin/sim-vending";

export const simVendingService = {
  getOverview: (): Promise<SimVendingOverview> =>
    apiClient.get<ApiEnvelope<SimVendingOverview>>(`${BASE}/overview`).then((r) => r.data.data),

  // Same trust bootstrap as affiliates: name in, one-time code out. The
  // agent app exchanges the code for its slug/secret on first connect
  // (POST /api/sim/register).
  generateCode: (name: string): Promise<SimRegistrationCode> =>
    apiClient
      .post<ApiEnvelope<SimRegistrationCode>>(`${BASE}/devices/generate-code`, { name })
      .then((r) => r.data.data),

  // The new secret is returned exactly once — the old one stops verifying
  // the moment this resolves.
  regenerateSecret: (deviceId: number): Promise<string> =>
    apiClient
      .post<ApiEnvelope<{ secret: string }>>(`${BASE}/devices/${deviceId}/regenerate-secret`)
      .then((r) => r.data.data.secret),

  updateDevice: (
    deviceId: number,
    payload: Partial<{ name: string; status: SimDevice["status"] }>,
  ): Promise<SimDevice> =>
    apiClient
      .put<ApiEnvelope<SimDevice>>(`${BASE}/devices/${deviceId}`, payload)
      .then((r) => r.data.data),

  removeDevice: (deviceId: number): Promise<void> =>
    apiClient.delete(`${BASE}/devices/${deviceId}`).then(() => undefined),

  updateSim: (deviceId: number, simId: number, payload: SimUpdatePayload): Promise<SimRow> =>
    apiClient
      .put<ApiEnvelope<SimRow>>(`${BASE}/devices/${deviceId}/sims/${simId}`, payload)
      .then((r) => r.data.data),

  // Vend config (network, transfer PIN, balance USSD) is defined HERE and
  // pulled by the hub over its signed config endpoint — nothing is
  // hand-edited on the hub's filesystem.
  createSim: (deviceId: number, payload: SimCreatePayload): Promise<SimRow> =>
    apiClient
      .post<ApiEnvelope<SimRow>>(`${BASE}/devices/${deviceId}/sims`, payload)
      .then((r) => r.data.data),
};
