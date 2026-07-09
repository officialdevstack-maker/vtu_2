import { apiClient } from "@shared/api/apiClient";

// The real payload sits exactly one `.data` deep: r.data.data (see
// backend/app/Http/Middleware/HandleRequest.php).
type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// One row per install (App\Models\StockVending, seeded id 1). Each column
// holds the NAME of the vendor that fulfils that service category — the
// value Vendor::scopeProvider() matches provider rows against. Column keys
// mirror the migration verbatim, spaces and all ("cooperate gifting",
// "data pin", "recharge pin").
export type StockVending = {
  sns?: string | null;
  vtu?: string | null;
  sme?: string | null;
  gifting?: string | null;
  "cooperate gifting"?: string | null;
  dstv?: string | null;
  gotv?: string | null;
  startimes?: string | null;
  "data pin"?: string | null;
  "recharge pin"?: string | null;
  exam?: string | null;
  electricity?: string | null;
  bulksms?: string | null;
};

// The service columns we let admins route. Ordered/grouped for the form.
export const STOCK_VENDING_COLUMNS = [
  "sns",
  "vtu",
  "sme",
  "gifting",
  "cooperate gifting",
  "dstv",
  "gotv",
  "startimes",
  "data pin",
  "recharge pin",
  "exam",
  "electricity",
  "bulksms",
] as const;

export type StockVendingColumn = (typeof STOCK_VENDING_COLUMNS)[number];

export type StockVendingPayload = Record<StockVendingColumn, string | null>;

// Uses the Universal Table API against Eloquent's default table name for
// App\Models\StockVending ("stock_vendings") — there is exactly one row, id 1
// (StockVendingSeeder). Mirrors generalService's singleton pattern.
const BASE = "/table/stock_vendings";

export const stockVendingService = {
  get: (): Promise<StockVending> =>
    apiClient
      .get<ApiEnvelope<StockVending>>(`${BASE}/1`)
      .then((r) => r.data.data),

  update: (payload: Partial<StockVendingPayload>): Promise<StockVending> =>
    apiClient
      .put<ApiEnvelope<StockVending>>(`${BASE}/1`, payload)
      .then((r) => r.data.data),
};
