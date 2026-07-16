import { apiClient } from "@shared/api/apiClient";
import { memoizedCatalogRequest } from "@shared/api/catalogCache";

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
  // Airtime-to-cash config for this network (Products > Airtime & Data >
  // Networks) — the number to transfer airtime to, the amount range
  // accepted, and whether conversion is enabled at all for this network.
  airtime_to_cash_destination_number?: string | null;
  airtime_to_cash_min?: string | number | null;
  airtime_to_cash_max?: string | number | null;
  airtime_to_cash_active?: boolean;
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

// A disco's bill plan (Products > Bill) — the Airtime Plan equivalent for
// electricity: no fixed catalog price (it's pay-any-amount), just whether
// the disco is purchasable at all and its own amount range. See
// ServiceRequest::ruleMaker's "electricity" case, which enforces this same
// row server-side.
export type BillPlan = {
  id: number;
  disco: string;
  min: string | number;
  max: string | number;
  active: boolean;
};

export type AirtimeToCashStatus = "pending" | "approved" | "rejected";

// A customer's own submission — manually reviewed by an admin, never an
// instant purchase. See AirtimeToCashController.
export type AirtimeToCashRequestItem = {
  id: number;
  network: string;
  amount: string | number;
  sender_phone: string;
  destination_number: string;
  payout_amount: string | number;
  status: AirtimeToCashStatus;
  rejection_reason: string | null;
  proof_image: string | null;
  transaction_reference: string;
  payout_transaction_reference: string | null;
  created_at: string;
};

export type AirtimeToCashSubmitPayload = {
  network: string;
  amount: number;
  sender_phone: string;
  proof_image?: File | null;
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

export type ElectricityPurchasePayload = {
  disco: string;
  meter_number: string;
  meter_type: "prepaid" | "postpaid";
  amount: number;
  bypass: boolean;
  pin: string;
  code?: string;
};

// Same shape as CableVerification — just the account holder's name.
export type ElectricityVerification = { name: string };

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
  // Electricity only — the real prepaid token to load onto the meter.
  token?: string | null;
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
  // Electricity only — Bill Plan's per-role fee, additive on top (see
  // BillPlan::resolveServiceFee). Zero/absent for every other service.
  service_fee?: number;
  final_amount?: number;
};

// A live discount rule for a service/network — enough to compute the
// discounted price of any listed plan client-side (mirrors
// Discount::getDiscountedAmount on the backend).
export type ActiveDiscount = {
  discount_type: "fixed" | "percentage";
  value: number;
};

// Apply a discount rule to a price. Returns the price unchanged when there's
// no discount. Mirrors Discount::getDiscountedAmount exactly (fixed is capped
// at the price; percentage is value% off), rounded to 2dp.
export const applyDiscount = (
  price: number,
  discount: ActiveDiscount | null | undefined,
): number => {
  if (!discount || price <= 0) return price;
  const reduction =
    discount.discount_type === "fixed"
      ? Math.min(discount.value, price)
      : price * (discount.value / 100);
  return Math.max(0, Math.round((price - reduction) * 100) / 100);
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

// See CustomerController::referralStats(). pending_referrals are people
// who signed up with this code but haven't completed a successful
// transaction yet, so no commission has been earned from them.
export type ReferralStats = {
  referral_code: string | null;
  total_referrals: number;
  pending_referrals: number;
  active_referrals: number;
  referral_balance: number;
  total_earnings: number;
  commission_rate: number;
};

// A recipient resolved by username/email/phone before sending — shown so
// the sender can confirm they're paying the right person, mirroring how a
// bank app shows the beneficiary name before you commit. See
// WalletTransferController::lookup().
export type WalletTransferRecipient = { id: number; username: string; fullname: string };

export type WalletTransferPayload = {
  identifier: string;
  amount: number;
  pin: string;
  note?: string;
};

// Shape of a Transaction row (WalletTransferController::send() returns the
// sender's own outgoing transaction, with related_reference pointing at the
// recipient's incoming one).
export type WalletTransferResult = {
  id: number;
  transaction_reference: string;
  related_reference: string | null;
  amount: string | number;
  status: "success" | "pending" | "fail";
  receiver: string | null;
  created_at: string;
};

export type WalletBank = { code: string; name: string };

export type WalletWithdrawalStatus = "pending" | "completed" | "failed" | "rejected";

// A customer's own withdrawal request — real money leaving the platform via
// a payment gateway's transfer API, so (unlike wallet-to-wallet) this may
// sit pending for admin review depending on
// Setting::wallet_withdrawal_auto_approve. See WalletWithdrawalController.
export type WalletWithdrawalItem = {
  id: number;
  amount: string | number;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: WalletWithdrawalStatus;
  rejection_reason: string | null;
  gateway_reference: string | null;
  transaction_reference: string;
  created_at: string;
};

export type WalletWithdrawalPayload = {
  amount: number;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  pin: string;
};

export const customerService = {
  getDashboardUser: (): Promise<import("@/shared/providers/auth").User> =>
    apiClient
      .get<{ data: { user: import("@/shared/providers/auth").User } }>(
        "/user?include_dashboard=1",
      )
      .then((r) => r.data.data.user),

  // Moves the user's entire referral_balance into wallet_balance.
  // Backend returns the updated user, but callers should prefer
  // refreshUser() from useAuth() afterward to keep every field in sync.
  convertReferralToWallet: (userId: string | number): Promise<void> =>
    apiClient.post(`/customer/${userId}/convert-referral`).then(() => undefined),

  getReferralStats: (): Promise<ReferralStats> =>
    apiClient
      .get<ApiEnvelope<ReferralStats>>("/customer/referral-stats")
      .then((r) => r.data.data),

  getUpgradeTiers: (): Promise<UpgradeTiersResponse> =>
    apiClient
      .get<ApiEnvelope<UpgradeTiersResponse>>("/customer/account/upgrade-tiers")
      .then((r) => r.data.data),

  upgradeAccount: (payload: { upgrade_to: string; pin: string }): Promise<UpgradeResult> =>
    apiClient
      .post<UpgradeResult>("/customer/account/upgrade", payload)
      .then((r) => r.data),

  getNetworks: (): Promise<Network[]> =>
    memoizedCatalogRequest("customer:networks", () =>
      apiClient
        .get<ApiEnvelope<Network[]>>("/table/networks")
        .then((r) => r.data.data),
      3 * 60_000,
    ),

  getAirtimePlans: (): Promise<AirtimePlan[]> =>
    memoizedCatalogRequest("customer:airtime-plans", () =>
      apiClient
        .get<ApiEnvelope<AirtimePlan[]>>("/table/airtime_plans")
        .then((r) => r.data.data),
      60_000,
    ),

  purchaseAirtime: (payload: AirtimePurchasePayload & { tx_ref: string }): Promise<PurchaseResult> =>
    apiClient
      .post<ApiEnvelope<PurchaseResult>>("/vtu/airtime", payload)
      .then((r) => r.data.data),

  getDataPlans: (): Promise<DataPlan[]> =>
    memoizedCatalogRequest("customer:data-plans", () =>
      apiClient
        .get<ApiEnvelope<DataPlan[]>>("/table/data_plans")
        .then((r) => r.data.data),
      60_000,
    ),

  purchaseData: (payload: DataPurchasePayload & { tx_ref: string }): Promise<PurchaseResult> =>
    apiClient
      .post<ApiEnvelope<PurchaseResult>>("/vtu/data", payload)
      .then((r) => r.data.data),

  getCableNetworks: (): Promise<CableNetwork[]> =>
    memoizedCatalogRequest("customer:cable-networks", () =>
      apiClient
        .get<ApiEnvelope<CableNetwork[]>>("/table/network_types")
        .then((r) => r.data.data.filter((n) => n.service_type === "cable")),
      60_000,
    ),

  getCablePlans: (): Promise<CablePlan[]> =>
    memoizedCatalogRequest("customer:cable-plans", () =>
      apiClient
        .get<ApiEnvelope<CablePlan[]>>("/table/cable_plans")
        .then((r) => r.data.data),
      60_000,
    ),

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

  getBillPlans: (): Promise<BillPlan[]> =>
    memoizedCatalogRequest("customer:bill-plans", () =>
      apiClient
        .get<ApiEnvelope<BillPlan[]>>("/table/bill_plans")
        .then((r) => r.data.data),
      60_000,
    ),

  verifyMeter: (disco: string, meterNumber: string, meterType: "prepaid" | "postpaid"): Promise<ElectricityVerification> =>
    apiClient
      .get<ApiEnvelope<ElectricityVerification>>("/vtu/electricity/verify", {
        params: { disco, identifier: meterNumber, meter_type: meterType },
      })
      .then((r) => r.data.data),

  purchaseElectricity: (payload: ElectricityPurchasePayload & { tx_ref: string }): Promise<PurchaseResult> =>
    apiClient
      .post<ApiEnvelope<PurchaseResult>>("/vtu/electricity", payload)
      .then((r) => r.data.data),

  // Reuses the same /table/networks read as everywhere else — a network is
  // available for conversion when its airtime_to_cash_active flag is set
  // (Products > Airtime & Data > Networks), not a separate list.
  getAirtimeToCashNetworks: (): Promise<Network[]> =>
    customerService.getNetworks(),

  getMyAirtimeToCashRequests: (): Promise<AirtimeToCashRequestItem[]> =>
    apiClient
      .get<ApiEnvelope<AirtimeToCashRequestItem[]>>("/customer/airtime-to-cash")
      .then((r) => r.data.data),

  submitAirtimeToCash: (payload: AirtimeToCashSubmitPayload): Promise<AirtimeToCashRequestItem> => {
    const form = new FormData();
    form.append("network", payload.network);
    form.append("amount", String(payload.amount));
    form.append("sender_phone", payload.sender_phone);
    if (payload.proof_image) form.append("proof_image", payload.proof_image);
    return apiClient
      .post<ApiEnvelope<AirtimeToCashRequestItem>>("/customer/airtime-to-cash", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data);
  },

  // Preview of the automatic Discount (if any) for a given service+network+
  // amount, without charging anything — mirrors VTUServicesController::handle()'s
  // Step 1 exactly (same Discount::getDiscountedAmount call). `extra` lets
  // callers pass service-specific params the backend also reads, e.g.
  // `disco` for electricity's Bill Plan service-fee preview.
  previewDiscount: (
    service: string,
    network: string,
    amount: number,
    extra?: Record<string, string>,
  ): Promise<DiscountPreview> =>
    apiClient
      .get<ApiEnvelope<DiscountPreview>>(`/vtu/${service}/discount`, { params: { amount, network, ...extra } })
      .then((r) => r.data.data),

  // The active discount RULE for a service/network (or null) — lets the plan
  // list strike through and discount every price in one call rather than
  // previewing each amount. See VTUServicesController::activeDiscount.
  getActiveDiscount: (
    service: string,
    network?: string,
  ): Promise<ActiveDiscount | null> =>
    apiClient
      .get<ApiEnvelope<{ discount: ActiveDiscount | null }>>(
        `/vtu/${service}/active-discount`,
        { params: network ? { network } : {} },
      )
      .then((r) => r.data.data.discount),

  lookupWalletTransferRecipient: (identifier: string): Promise<WalletTransferRecipient> =>
    apiClient
      .get<ApiEnvelope<WalletTransferRecipient>>("/customer/wallet-transfer/lookup", { params: { identifier } })
      .then((r) => r.data.data),

  sendWalletTransfer: (payload: WalletTransferPayload): Promise<WalletTransferResult> =>
    apiClient
      .post<ApiEnvelope<WalletTransferResult>>("/customer/wallet-transfer", payload)
      .then((r) => r.data.data),

  getWithdrawalBanks: (): Promise<{
    available: boolean;
    banks: WalletBank[];
    // Payout gateway's withdrawal fee (added on top of the amount). type is
    // "fiat" (flat ₦) or "percent". Absent/0 when the gateway charges none.
    withdrawal_fee?: number;
    withdrawal_fee_type?: "fiat" | "percent" | string;
  }> =>
    apiClient
      .get<
        ApiEnvelope<{
          available: boolean;
          banks: WalletBank[];
          withdrawal_fee?: number;
          withdrawal_fee_type?: string;
        }>
      >("/customer/wallet-withdrawals/banks")
      .then((r) => r.data.data),

  getMyWalletWithdrawals: (): Promise<WalletWithdrawalItem[]> =>
    apiClient
      .get<ApiEnvelope<WalletWithdrawalItem[]>>("/customer/wallet-withdrawals")
      .then((r) => r.data.data),

  submitWalletWithdrawal: (payload: WalletWithdrawalPayload): Promise<WalletWithdrawalItem> =>
    apiClient
      .post<ApiEnvelope<WalletWithdrawalItem>>("/customer/wallet-withdrawals", payload)
      .then((r) => r.data.data),
};
