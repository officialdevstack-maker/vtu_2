import { apiClient } from "@shared/api/apiClient";

// Every JSON response is wrapped once before it reaches the browser, by the
// global HandleRequest middleware, which merges its own `meta` into the
// controller's own response body: { message, success, data: <payload>, type,
// meta }. So the real payload always sits exactly one `.data` deep.
type ApiEnvelope<T> = {
  message: string;
  success: boolean;
  data: T;
  type: string;
  meta: unknown;
};

// ─── Promotion (promo code) ────────────────────────────────────────────────
// A Promotion is a distinct concept from a Discount (see
// products/airtime-data/service.ts): a Discount is an automatic, no-code,
// per-network role-priced percentage applied at checkout; a Promotion is an
// opt-in code (or admin-triggered "auto") reduction with its own date
// window, usage limits, and eligibility rules. Uses /admin/promotions.

export type PromotionApply = "auto" | "code";
export type PromotionTarget = "customer" | "reseller" | "both";
export type PromotionProduct = "airtime" | "data" | "bundle";
export type PromotionType = "percentage" | "fixed" | "bonus_data" | "cashback";

export type PromotionCondition =
  | { kind: "min_amount"; amount: number }
  | { kind: "max_amount"; amount: number };

export type Promotion = {
  id: number;
  name: string;
  code: string | null;
  apply: PromotionApply;
  target: PromotionTarget;
  product: PromotionProduct;
  provider: string | null;
  type: PromotionType;
  value: string | number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit_total: number | null;
  usage_limit_per_customer: number | null;
  used: number;
  conditions: PromotionCondition[] | null;
  created_at?: string;
  updated_at?: string;
};

export type PromotionPayload = {
  name: string;
  code?: string | null;
  apply: PromotionApply;
  target: PromotionTarget;
  product: PromotionProduct;
  provider?: string | null;
  type: PromotionType;
  value: number;
  active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  usage_limit_total?: number | null;
  usage_limit_per_customer?: number | null;
  conditions?: PromotionCondition[];
};

const PROMOTIONS = "/admin/promotions";

export const promotionService = {
  getAll: (): Promise<Promotion[]> =>
    apiClient
      .get<ApiEnvelope<{ promotions: Promotion[] }>>(PROMOTIONS)
      .then((r) => r.data.data.promotions),

  getById: (id: number | string): Promise<Promotion> =>
    apiClient
      .get<ApiEnvelope<{ promotion: Promotion }>>(`${PROMOTIONS}/${id}`)
      .then((r) => r.data.data.promotion),

  create: (payload: PromotionPayload): Promise<Promotion> =>
    apiClient
      .post<ApiEnvelope<{ promotion: Promotion }>>(PROMOTIONS, payload)
      .then((r) => r.data.data.promotion),

  update: (
    id: number | string,
    payload: Partial<PromotionPayload>,
  ): Promise<Promotion> =>
    apiClient
      .put<ApiEnvelope<{ promotion: Promotion }>>(`${PROMOTIONS}/${id}`, payload)
      .then((r) => r.data.data.promotion),

  remove: (id: number | string): Promise<void> =>
    apiClient.delete(`${PROMOTIONS}/${id}`).then(() => undefined),

  toggleStatus: (promotion: Promotion): Promise<Promotion> =>
    apiClient
      .put<ApiEnvelope<{ promotion: Promotion }>>(`${PROMOTIONS}/${promotion.id}`, {
        active: !promotion.active,
      })
      .then((r) => r.data.data.promotion),
};

// ─── Discount ───────────────────────────────────────────────────────────────
// A Discount is a per-network price-slash that (optionally) only applies
// within a starts_at/ends_at window — e.g. "Black Friday, Nov 24-27". No
// window set = always-on whenever active. Distinct from Promotion above
// (an opt-in code) and from Event (a to-be-built reward for a user action
// like a referral, not a price-slash). Uses the Universal Table API:
// /table/discounts

export type Discount = {
  id: string | number;
  name: string;
  network?: string | null;
  category?: string | null;
  type?: string | null;
  min?: string | number | null;
  max?: string | number | null;
  active?: boolean | null;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DiscountPayload = {
  name: string;
  category?: string | null;
  type?: string | null;
  min?: string | number | null;
  max?: string | number | null;
  active?: boolean | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

const DISCOUNT = "/table/discounts";

export const discountService = {
  getAll: (): Promise<Discount[]> =>
    apiClient.get<ApiEnvelope<Discount[]>>(DISCOUNT).then((r) => r.data.data),

  getById: (id: string): Promise<Discount> =>
    apiClient
      .get<ApiEnvelope<Discount>>(`${DISCOUNT}/${id}`)
      .then((r) => r.data.data),

  create: (payload: DiscountPayload): Promise<Discount> =>
    apiClient
      .post<ApiEnvelope<Discount>>(DISCOUNT, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: Partial<DiscountPayload>): Promise<Discount> =>
    apiClient
      .put<ApiEnvelope<Discount>>(`${DISCOUNT}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`${DISCOUNT}/${id}`).then(() => undefined),

  toggleStatus: (discount: Discount): Promise<Discount> =>
    apiClient
      .put<ApiEnvelope<Discount>>(`${DISCOUNT}/${discount.id}`, {
        active: !(discount.active ?? false),
      })
      .then((r) => r.data.data),
};

// ─── Cashback ───────────────────────────────────────────────────────────────
// Replaces the old per-role Discount pricing: a flat percentage credited to
// the user's wallet immediately after a successful purchase, one rate per
// service type (not per network, not per role) — see
// TransactionService::creditCashback on the backend. service_type matches
// Transaction::transaction_type values, e.g. "airtime_recharge".
// Uses the Universal Table API: /table/cashback_rates

export type CashbackRate = {
  id: string | number;
  service_type: string;
  percentage: string | number;
  active: boolean;
};

const CASHBACK_RATES = "/table/cashback_rates";

export const cashbackRateService = {
  getAll: (): Promise<CashbackRate[]> =>
    apiClient
      .get<ApiEnvelope<CashbackRate[]>>(CASHBACK_RATES)
      .then((r) => r.data.data),

  getByServiceType: (serviceType: string): Promise<CashbackRate | undefined> =>
    cashbackRateService
      .getAll()
      .then((rates) => rates.find((r) => r.service_type === serviceType)),

  update: (
    id: string | number,
    payload: { percentage: number; active?: boolean },
  ): Promise<CashbackRate> =>
    apiClient
      .put<ApiEnvelope<CashbackRate>>(`${CASHBACK_RATES}/${id}`, payload)
      .then((r) => r.data.data),
};
