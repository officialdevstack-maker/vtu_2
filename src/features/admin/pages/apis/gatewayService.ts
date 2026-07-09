import { apiClient } from "@shared/api/apiClient";

// The real payload sits exactly one `.data` deep: r.data.data (see
// backend/app/Http/Middleware/HandleRequest.php).
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type Gateway = {
  id: string | number;
  name: string;
  code?: string | null;
  balance?: string | number | null;
  connection?: boolean | null;
  // Each gateway integration reads a different combination of these —
  // Flutterwave: api_key only. Monnify: api_key + secret_key + username.
  // PaymentPoint: password + api_key. Kept distinct rather than merged.
  username?: string | null;
  password?: string | null;
  api_key?: string | null;
  secret_key?: string | null;
  // Secret used to VERIFY inbound webhooks — Flutterwave's verif-hash and
  // PaymentPoint's HMAC key both read this column. Distinct from the API
  // credentials above (which authenticate our OUTbound calls). Without it,
  // those two gateways reject every funding webhook, so wallets never credit.
  webhook_access?: string | null;
  category?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  identifier?: string | null;
  webhook?: string | null;
};

export type GatewayPayload = {
  name: string;
  code?: string | null;
  username?: string | null;
  password?: string | null;
  api_key?: string | null;
  secret_key?: string | null;
  webhook_access?: string | null;
  connection?: boolean;
};

const BASE = "/table/providers";

// Known gateways that support outbound transfers (auto-fund payouts).
const TRANSFER_SUPPORT: Record<string, boolean> = {
  flutterwave: true,
  monnify: false,
  "payment point": false,
};

export const gatewaySupportsTransfer = (name: string) =>
  TRANSFER_SUPPORT[name.trim().toLowerCase()] ?? false;

export const gatewayService = {
  getAll: (): Promise<Gateway[]> =>
    apiClient
      .get<ApiEnvelope<Gateway[]>>(BASE, {
        params: { category: "payment" },
      })
      .then((r) => r.data.data),

  getById: (id: string): Promise<Gateway> =>
    apiClient
      .get<ApiEnvelope<Gateway>>(`${BASE}/${id}`)
      .then((r) => r.data.data),

  // sub_category="payment" is what makes the webhook URL route to the
  // payment handler: Provider::getWebhookAttribute builds
  // /api/webhook/{sub_category}/{identifier}, and WebhookController only
  // dispatches to Payment::webhook when {type} is "payment". Without it the
  // generated webhook URL is malformed (empty type segment) and funding
  // callbacks never reach the crediting code.
  create: (payload: GatewayPayload): Promise<Gateway> =>
    apiClient
      .post<ApiEnvelope<Gateway>>(BASE, {
        ...payload,
        category: "payment",
        sub_category: "payment",
      })
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<GatewayPayload>): Promise<Gateway> =>
    apiClient
      .put<ApiEnvelope<Gateway>>(`${BASE}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${BASE}/${id}`).then(() => undefined),

  toggleConnection: (g: Gateway): Promise<Gateway> =>
    apiClient
      .put<ApiEnvelope<Gateway>>(`${BASE}/${g.id}`, {
        connection: !g.connection,
      })
      .then((r) => r.data.data),

  // Provider and Vendor share the same `providers` table/column, so the
  // vendor-prefixed refresh-token route works for payment gateways too.
  refreshToken: (id: string): Promise<string> =>
    apiClient
      .get<ApiEnvelope<{ identifier: string }>>(
        `/admin/vendor/${id}/refresh-token`,
      )
      .then((r) => r.data.data.identifier),
};
