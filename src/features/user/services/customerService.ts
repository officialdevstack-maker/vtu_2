import { apiClient } from "@shared/api/apiClient";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// Public (unauthenticated) Universal Table API read — see AdminController::universalGet.
// Each network eager-loads its network_types; pivot.active reflects whether
// that specific network+service-type pairing is currently enabled for
// purchase (the same toggle Service Control manages admin-side).
export type Network = {
  id: number;
  name: string;
  network_types: {
    id: number;
    name: string;
    service_type: string;
    pivot: { active: boolean | number };
  }[];
};

// The admin-configured per-network airtime rule (Products > Airtime & Data
// > Airtime Plan) — the real source of truth for whether a network is
// purchasable at all, and its own amount range (e.g. one network might cap
// lower than another). See ServiceRequest::ruleMaker's "airtime" case,
// which enforces this same row server-side.
export type AirtimePlan = {
  id: number;
  name: string;
  category: string | null;
  min: string | number | null;
  max: string | number | null;
  active: boolean;
};

// A fixed-price catalog bundle (Products > Airtime & Data > Data Plans).
// `price` is resolved server-side per the authenticated user's role (see
// DataPlan::getPriceAttribute) — never computed client-side, and never
// trusted back from the client on purchase either (VTUServicesController::
// handle() re-resolves it from data_plan for the actual charge).
export type DataPlan = {
  id: number;
  network: string;
  plan_name: string;
  plan_size: string;
  plan_type: string;
  plan: string;
  validity: string;
  active: boolean;
  price: number | string | null;
};

// A unique reference the backend requires per purchase (ServiceRequest's
// `tx_ref` => `required|unique:transactions,transaction_reference`) — not a
// real payment-gateway reference, just a client-generated idempotency key.
export function generateTxRef(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type AirtimePurchasePayload = {
  network: string;
  phone: string;
  amount: number;
  network_type: string;
  bypass: boolean;
  pin: string;
  code?: string;
};

export type DataPurchasePayload = {
  network: string;
  phone: string;
  amount: number;
  plan_type: string;
  data_plan: number;
  bypass: boolean;
  pin: string;
  code?: string;
};

// Shape of VTUServicesController::handle()'s success response — the real
// Transaction row plus a discount_applied breakdown (see
// TransactionService::process on the backend).
export type PurchaseResult = {
  id: number;
  transaction_reference: string;
  transaction_type: string;
  amount: string | number;
  status: "success" | "pending" | "fail";
  receiver: string | null;
  account_or_phone: string | null;
  created_at: string;
  discount_applied?: {
    discount_amount: number;
    original_amount: number;
    final_amount: number;
    promotion_id: number | null;
  };
};

export type DiscountPreview = {
  original_amount: number;
  discounted_amount: number;
  discount_amount: number;
};

export const customerService = {
  // Moves the user's entire referral_balance into wallet_balance.
  // Backend returns the updated user, but callers should prefer
  // refreshUser() from useAuth() afterward to keep every field in sync.
  convertReferralToWallet: (userId: string | number): Promise<void> =>
    apiClient.post(`/customer/${userId}/convert-referral`).then(() => undefined),

  getNetworks: (): Promise<Network[]> =>
    apiClient
      .get<ApiEnvelope<Network[]>>("/table/networks")
      .then((r) => r.data.data),

  getAirtimePlans: (): Promise<AirtimePlan[]> =>
    apiClient
      .get<ApiEnvelope<AirtimePlan[]>>("/table/airtime_plans")
      .then((r) => r.data.data),

  purchaseAirtime: (payload: AirtimePurchasePayload & { tx_ref: string }): Promise<PurchaseResult> =>
    apiClient
      .post<ApiEnvelope<PurchaseResult>>("/vtu/airtime", payload)
      .then((r) => r.data.data),

  getDataPlans: (): Promise<DataPlan[]> =>
    apiClient
      .get<ApiEnvelope<DataPlan[]>>("/table/data_plans")
      .then((r) => r.data.data),

  purchaseData: (payload: DataPurchasePayload & { tx_ref: string }): Promise<PurchaseResult> =>
    apiClient
      .post<ApiEnvelope<PurchaseResult>>("/vtu/data", payload)
      .then((r) => r.data.data),

  // Preview of the automatic Discount (if any) for a given service+network+
  // amount, without charging anything — mirrors VTUServicesController::handle()'s
  // Step 1 exactly (same Discount::getDiscountedAmount call).
  previewDiscount: (service: string, network: string, amount: number): Promise<DiscountPreview> =>
    apiClient
      .get<ApiEnvelope<DiscountPreview>>(`/vtu/${service}/discount`, { params: { amount, network } })
      .then((r) => r.data.data),
};
