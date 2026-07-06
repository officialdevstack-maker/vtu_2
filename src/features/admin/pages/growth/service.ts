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
// A flash-sale-style price cut the platform applies automatically (no code
// needed), scoped to a service type and optionally one network, for a flat
// percentage or fixed amount, optionally time-boxed with a starts_at/ends_at
// window — e.g. "Black Friday, Nov 24-27". No window set = always-on
// whenever active. Distinct from Promotion above (an opt-in code) and from
// Event (a reward for a user action like a referral, not a price-slash).
// Uses the dedicated, validated /admin/discounts endpoint (not the generic
// Universal Table API — see DiscountController on the backend).

export type DiscountServiceType = "airtime" | "data" | "cable" | "electricity" | "exam" | "airtimeToCash" | "user_upgrade";
export type DiscountValueType = "percentage" | "fixed";

export type Discount = {
  id: string | number;
  name: string;
  service_type: DiscountServiceType;
  network: string | null;
  discount_type: DiscountValueType;
  value: string | number;
  active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DiscountPayload = {
  name: string;
  service_type: DiscountServiceType;
  network?: string | null;
  discount_type: DiscountValueType;
  value: number;
  active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
};

const DISCOUNT = "/admin/discounts";

export const discountService = {
  getAll: (): Promise<Discount[]> =>
    apiClient
      .get<ApiEnvelope<{ discounts: Discount[] }>>(DISCOUNT)
      .then((r) => r.data.data.discounts),

  getById: (id: string | number): Promise<Discount> =>
    apiClient
      .get<ApiEnvelope<{ discount: Discount }>>(`${DISCOUNT}/${id}`)
      .then((r) => r.data.data.discount),

  create: (payload: DiscountPayload): Promise<Discount> =>
    apiClient
      .post<ApiEnvelope<{ discount: Discount }>>(DISCOUNT, payload)
      .then((r) => r.data.data.discount),

  update: (id: string | number, payload: Partial<DiscountPayload>): Promise<Discount> =>
    apiClient
      .put<ApiEnvelope<{ discount: Discount }>>(`${DISCOUNT}/${id}`, payload)
      .then((r) => r.data.data.discount),

  remove: (id: string | number): Promise<void> =>
    apiClient.delete(`${DISCOUNT}/${id}`).then(() => undefined),

  toggleStatus: (discount: Discount): Promise<Discount> =>
    apiClient
      .put<ApiEnvelope<{ discount: Discount }>>(`${DISCOUNT}/${discount.id}`, {
        active: !discount.active,
      })
      .then((r) => r.data.data.discount),
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

// ─── Event ──────────────────────────────────────────────────────────────────
// An admin-defined condition a user must fulfil to earn a badge, cash, or
// both — e.g. "refer 5 friends" or "spend ₦50,000 on data". Distinct from
// Discount (automatic price-slash) and Promotion (opt-in code): Event is
// reward-for-achievement, not a price reduction. See EventService on the
// backend for exactly how each metric is computed and awarded.
// Uses /admin/events.

export type EventMetric =
  | "referral_count"
  | "transaction_volume"
  | "transaction_count"
  | "wallet_funding_total";

export type EventRewardType = "badge" | "cash" | "both";

export type EventRecord = {
  id: number;
  name: string;
  description: string | null;
  metric: EventMetric;
  service_type: string | null;
  threshold: string | number;
  repeatable: boolean;
  reward_type: EventRewardType;
  badge_name: string | null;
  badge_icon: string | null;
  cash_amount: string | number | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type EventPayload = {
  name: string;
  description?: string | null;
  metric: EventMetric;
  service_type?: string | null;
  threshold: number;
  repeatable?: boolean;
  reward_type: EventRewardType;
  badge_name?: string | null;
  badge_icon?: string | null;
  cash_amount?: number | null;
  active?: boolean;
};

const EVENTS = "/admin/events";

export const eventService = {
  getAll: (): Promise<EventRecord[]> =>
    apiClient
      .get<ApiEnvelope<{ events: EventRecord[] }>>(EVENTS)
      .then((r) => r.data.data.events),

  getById: (id: number | string): Promise<EventRecord> =>
    apiClient
      .get<ApiEnvelope<{ event: EventRecord }>>(`${EVENTS}/${id}`)
      .then((r) => r.data.data.event),

  create: (payload: EventPayload): Promise<EventRecord> =>
    apiClient
      .post<ApiEnvelope<{ event: EventRecord }>>(EVENTS, payload)
      .then((r) => r.data.data.event),

  update: (id: number | string, payload: Partial<EventPayload>): Promise<EventRecord> =>
    apiClient
      .put<ApiEnvelope<{ event: EventRecord }>>(`${EVENTS}/${id}`, payload)
      .then((r) => r.data.data.event),

  remove: (id: number | string): Promise<void> =>
    apiClient.delete(`${EVENTS}/${id}`).then(() => undefined),

  toggleStatus: (event: EventRecord): Promise<EventRecord> =>
    apiClient
      .put<ApiEnvelope<{ event: EventRecord }>>(`${EVENTS}/${event.id}`, {
        active: !event.active,
      })
      .then((r) => r.data.data.event),
};
