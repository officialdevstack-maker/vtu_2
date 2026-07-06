import { apiClient } from "@shared/api/apiClient";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// ─── Site settings (App\Models\Setting, table `settings`, single row id=1) ───
// Covers Transaction, Notification, Email, and Customer tabs — everything
// that isn't company/branding info (that's General, see generalService.ts).

export type SiteSettings = {
  id: number;
  referral_commission_rate: string | number;
  invoice_prefix: string;
  invoice_suffix: string | null;
  notify_admin_on_signup: boolean;
  notify_admin_on_funding: boolean;
  notify_admin_on_large_transaction: boolean;
  large_transaction_threshold: string | number;
  notify_admin_on_failed_transaction: boolean;
  mail_mailer: string | null;
  mail_host: string | null;
  mail_port: string | null;
  mail_username: string | null;
  // mail_password is $hidden on the backend model — never returned, write-only.
  mail_encryption: string | null;
  mail_from_address: string | null;
  mail_from_name: string | null;
  registrations_open: boolean;
  signup_bonus_amount: string | number;
  min_wallet_funding_amount: string | number;
  prune_transactions_enabled: boolean;
  prune_transactions_after_days: number;
  transactions_last_pruned_at: string | null;
  wallet_transfer_min: string | number;
  wallet_transfer_max: string | number;
  wallet_withdrawal_auto_approve: boolean;
  wallet_withdrawal_min: string | number;
  wallet_withdrawal_max: string | number;
  notify_admin_on_airtime_to_cash: boolean;
  notify_admin_on_wallet_withdrawal: boolean;
};

// Partial<SiteSettings> would still type mail_password as forbidden, so this
// payload explicitly allows the one write-only field alongside everything else.
export type SiteSettingsPayload = Partial<Omit<SiteSettings, "id">> & {
  mail_password?: string;
};

const SETTINGS_BASE = "/table/settings";

export const siteSettingsService = {
  get: (): Promise<SiteSettings> =>
    apiClient
      .get<ApiEnvelope<SiteSettings>>(`${SETTINGS_BASE}/1`)
      .then((r) => r.data.data),

  update: (payload: SiteSettingsPayload): Promise<SiteSettings> =>
    apiClient
      .put<ApiEnvelope<SiteSettings>>(`${SETTINGS_BASE}/1`, payload)
      .then((r) => r.data.data),
};

// ─── Transaction pruning (App\Classes\TransactionPruner) ─────────────────────

export const transactionPruningService = {
  previewCount: (): Promise<number> =>
    apiClient
      .get<ApiEnvelope<{ count: number }>>("/admin/transactions/prune-preview")
      .then((r) => r.data.data.count),

  pruneNow: (): Promise<number> =>
    apiClient
      .post<ApiEnvelope<{ pruned: number }>>("/admin/transactions/prune")
      .then((r) => r.data.data.pruned),
};

// ─── Welcome message (single record, App\Models\WelcomeMessage) ──────────────

export type WelcomeMessage = {
  id: number;
  title: string;
  body: string;
  active: boolean;
};

export type WelcomeMessagePayload = {
  title: string;
  body: string;
  active: boolean;
};

const WELCOME_BASE = "/admin/welcome-message";

export const welcomeMessageService = {
  get: (): Promise<WelcomeMessage | null> =>
    apiClient
      .get<ApiEnvelope<{ welcome_message: WelcomeMessage | null }>>(WELCOME_BASE)
      .then((r) => r.data.data.welcome_message),

  update: (payload: WelcomeMessagePayload): Promise<WelcomeMessage> =>
    apiClient
      .put<ApiEnvelope<{ welcome_message: WelcomeMessage }>>(WELCOME_BASE, payload)
      .then((r) => r.data.data.welcome_message),
};

// ─── Payees (App\Models\Payee) — who to pay, how, and how often ──────────────

export type Payee = {
  id: number;
  name: string;
  type: "staff" | "co_owner";
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  payout_type: "fixed" | "percentage";
  payout_value: string | number;
  frequency: "weekly" | "monthly" | "custom";
  active: boolean;
  notes: string | null;
};

export type PayeePayload = Omit<Payee, "id">;

const PAYEES_BASE = "/table/payees";

export const payeeService = {
  getAll: (): Promise<Payee[]> =>
    apiClient.get<ApiEnvelope<Payee[]>>(PAYEES_BASE).then((r) => r.data.data),

  create: (payload: PayeePayload): Promise<Payee> =>
    apiClient
      .post<ApiEnvelope<Payee>>(PAYEES_BASE, payload)
      .then((r) => r.data.data),

  update: (id: number, payload: Partial<PayeePayload>): Promise<Payee> =>
    apiClient
      .put<ApiEnvelope<Payee>>(`${PAYEES_BASE}/${id}`, payload)
      .then((r) => r.data.data),

  remove: (id: number): Promise<void> =>
    apiClient.delete(`${PAYEES_BASE}/${id}`).then(() => undefined),
};
