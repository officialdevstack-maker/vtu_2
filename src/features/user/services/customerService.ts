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

// A cable provider (dstv/gotv/startime) — a NetworkType row scoped to
// service_type "cable". Managed at Products > Cable > Cable Networks.
export type CableNetwork = {
  id: number;
  name: string;
  service_type: string;
  active: boolean;
};

// A cable subscription plan. `price` is resolved server-side (the
// provider's own subscription cost plus the authenticated user's role fee
// — see CablePlan::getPriceAttribute) — never computed client-side, and
// never trusted back from the client on purchase either
// (VTUServicesController::handle() re-resolves it from cable_plan).
export type CablePlan = {
  id: number;
  cable_network: string;
  plan_name: string;
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

export type CablePurchasePayload = {
  cable_network: string;
  iuc: string;
  amount: number;
  cable_plan: number;
  bypass: boolean;
  pin: string;
  code?: string;
};

// VTUServicesController::verify()'s response for cable — just the account
// holder's name, so the customer can confirm the smartcard/IUC number
// really is theirs before paying.
export type CableVerification = { name: string };

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

// A purchasable account tier — a Role the admin has marked `upgradable`
// (Customers > Roles & Permissions), with its `upgrade_cost` — see
// CustomerController::upgrade()/upgradeTiers().
export type UpgradeTier = { id: number; name: string; slug: string; cost: number };

export type UpgradeTiersResponse = {
  current_tier: string;
  current_tier_name: string;
  tiers: UpgradeTier[];
};

// CustomerController::upgrade() predates the standard {success,data}
// envelope and returns its own {message, user} / {error} shape directly.
export type UpgradeResult = { message: string; user: { user_type: string; wallet_balance: string | number } };

export const customerService = {
  // Moves the user's entire referral_balance into wallet_balance.
  // Backend returns the updated user, but callers should prefer
  // refreshUser() from useAuth() afterward to keep every field in sync.
  convertReferralToWallet: (userId: string | number): Promise<void> =>
    apiClient.post(`/customer/${userId}/convert-referral`).then(() => undefined),

  getUpgradeTiers: (): Promise<UpgradeTiersResponse> =>
    apiClient
      .get<ApiEnvelope<UpgradeTiersResponse>>("/customer/account/upgrade-tiers")
      .then((r) => r.data.data),

  upgradeAccount: (payload: { upgrade_to: string; pin: string }): Promise<UpgradeResult> =>
    apiClient
      .post<UpgradeResult>("/customer/account/upgrade", payload)
      .then((r) => r.data),

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

  getCableNetworks: (): Promise<CableNetwork[]> =>
    apiClient
      .get<ApiEnvelope<CableNetwork[]>>("/table/network_types")
      .then((r) => r.data.data.filter((n) => n.service_type === "cable")),

  getCablePlans: (): Promise<CablePlan[]> =>
    apiClient
      .get<ApiEnvelope<CablePlan[]>>("/table/cable_plans")
      .then((r) => r.data.data),

  verifyCableIuc: (cableNetwork: string, iuc: string): Promise<CableVerification> =>
    apiClient
      .get<ApiEnvelope<CableVerification>>("/vtu/cable/verify", {
        params: { cable_network: cableNetwork, identifier: iuc },
      })
      .then((r) => r.data.data),

  purchaseCable: (payload: CablePurchasePayload & { tx_ref: string }): Promise<PurchaseResult> =>
    apiClient
      .post<ApiEnvelope<PurchaseResult>>("/vtu/cable", payload)
      .then((r) => r.data.data),

  // Preview of the automatic Discount (if any) for a given service+network+
  // amount, without charging anything — mirrors VTUServicesController::handle()'s
  // Step 1 exactly (same Discount::getDiscountedAmount call).
  previewDiscount: (service: string, network: string, amount: number): Promise<DiscountPreview> =>
    apiClient
      .get<ApiEnvelope<DiscountPreview>>(`/vtu/${service}/discount`, { params: { amount, network } })
      .then((r) => r.data.data),
};
