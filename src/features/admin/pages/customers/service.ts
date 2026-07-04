import { apiClient } from "@shared/api/apiClient";

type CustomerStatus = "active" | "suspended" | "inactive";
type KycStatus = "verified" | "pending" | "unverified";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  txns: number;
  status: CustomerStatus;
  kyc: KycStatus;
  dateJoined: string;
  username?: string;
  userType?: string;
};

export type CustomerPayload = {
  name: string;
  email: string;
  phone: string;
  balance: number;
  status?: CustomerStatus;
  kyc?: KycStatus;
  username?: string;
  userType?: string;
};

const normalizeStatus = (value: unknown): CustomerStatus => {
  const raw = String(value ?? "").toLowerCase();
  if (raw.includes("suspend") || raw === "blocked") return "suspended";
  if (raw === "inactive" || raw === "false" || raw === "0") return "inactive";
  return "active";
};

const normalizeKyc = (value: unknown): KycStatus => {
  const raw = String(value ?? "").toLowerCase();
  if (raw === "verified" || raw === "true" || raw === "1") return "verified";
  if (raw === "pending") return "pending";
  return "unverified";
};

const mapCustomer = (item: any): Customer => ({
  id: String(item?.id ?? item?.user_id ?? ""),
  name: item?.fullname || item?.name || item?.username || "Unnamed user",
  email: item?.email || "",
  phone: item?.phone || item?.mobile || "",
  balance: Number(item?.wallet_balance ?? item?.balance ?? item?.wallet ?? 0),
  txns: Number(item?.transactions_count ?? item?.txns ?? item?.transaction_count ?? 0),
  status: normalizeStatus(item?.status ?? item?.account_status ?? item?.is_active),
  kyc: normalizeKyc(item?.kyc_status ?? item?.verification_status ?? item?.email_verified_at ?? item?.is_verified),
  dateJoined: item?.created_at || item?.date_joined || "",
  username: item?.username,
  userType: item?.user_type || item?.role || "user",
});

// The live API wraps /admin/users responses more deeply than the docs show
// (an extra `data` layer, likely from Laravel auto-wrapping a Resource inside
// the app's own envelope) — dig through nested `data` layers instead of
// hardcoding a fixed depth, so a wrapping change doesn't silently break this.
const digUser = (payload: any): any => {
  let node = payload;
  for (let i = 0; i < 4 && node != null; i++) {
    if (node.user) return node.user;
    if (node.id != null || node.email != null) return node;
    node = node.data;
  }
  return node ?? {};
};

const digUsers = (payload: any): any[] => {
  let node = payload;
  for (let i = 0; i < 4 && node != null; i++) {
    if (Array.isArray(node.users)) return node.users;
    if (Array.isArray(node)) return node;
    if (Array.isArray(node.data)) return node.data;
    node = node.data;
  }
  return [];
};

const randomPassword = () =>
  `Vtu${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 90 + 10)}!`;

const toCreatePayload = (payload: CustomerPayload) => ({
  fullname: payload.name,
  username: payload.username || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12),
  email: payload.email,
  phone: payload.phone,
  password: randomPassword(),
  user_type: payload.userType || "user",
});

const toUpdatePayload = (payload: CustomerPayload) => ({
  fullname: payload.name,
  email: payload.email,
  phone: payload.phone,
  wallet_balance: payload.balance,
  user_type: payload.userType || "user",
});

type ApiEnvelope<T> = { status: boolean; message: string; data: T };

const USERS = "/admin/users";

export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    try {
      const response = await apiClient.get<ApiEnvelope<any>>(USERS);
      return digUsers(response.data).map(mapCustomer);
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.response?.status === 401) {
        const fallback = await apiClient.get<ApiEnvelope<any>>("/table/users");
        return digUsers(fallback.data).map(mapCustomer);
      }
      throw error;
    }
  },

  getById: async (id: string): Promise<Customer> => {
    const response = await apiClient.get<ApiEnvelope<any>>(`${USERS}/${id}`);
    return mapCustomer(digUser(response.data));
  },

  create: async (payload: CustomerPayload): Promise<Customer> => {
    const response = await apiClient.post<ApiEnvelope<any>>(USERS, toCreatePayload(payload));
    return mapCustomer(digUser(response.data));
  },

  update: async (id: string, payload: CustomerPayload): Promise<Customer> => {
    const response = await apiClient.put<ApiEnvelope<any>>(
      `${USERS}/${id}`,
      toUpdatePayload(payload),
    );
    let user = digUser(response.data);
    // `status` isn't part of the /admin/users update contract — write it
    // through the Universal Table API when the edit form changed it.
    if (payload.status) {
      const statusResponse = await apiClient.put<ApiEnvelope<any>>(`/table/users/${id}`, {
        status: payload.status,
      });
      user = { ...user, ...statusResponse.data.data };
    }
    return mapCustomer(user);
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${USERS}/${id}`);
  },

  // /admin/users doesn't document a `status` field — it's a plain column on the
  // `users` table, so go through the Universal Table API to set it directly.
  toggleStatus: async (customer: Customer): Promise<Customer> => {
    const nextStatus = customer.status === "suspended" ? "active" : "suspended";
    const response = await apiClient.put<ApiEnvelope<any>>(`/table/users/${customer.id}`, {
      status: nextStatus,
    });
    return mapCustomer(response.data.data);
  },

  // POST /admin/users/{id}/fund — see API_DOCUMENTATION.md section 7.3.
  fundWallet: async (id: string, amount: number, type: "credit" | "debit"): Promise<Customer> => {
    const response = await apiClient.post<ApiEnvelope<any>>(`${USERS}/${id}/fund`, {
      amount,
      type,
    });
    return mapCustomer(digUser(response.data));
  },
};

// ─── Transactions ─────────────────────────────────────────────────────────────
// Uses the Universal Table API (/table/transactions) — see API_DOCUMENTATION.md
// section 12. Matches the `transactions` table schema exactly.

export type TransactionType =
  | "airtime_recharge"
  | "data_subscription"
  | "cable_subscription"
  | "electric_bill"
  | "exam_pin"
  | string;

export type Transaction = {
  id: number;
  user_id: string;
  amount: number;
  status: "pending" | "success" | "fail";
  transaction_type: TransactionType;
  reference: string;
  promotion_id: number | null;
  provider: string | null;
  recipient: string;
  created_at: string;
  updated_at: string;
};

// Universal Table API list responses vary between a flat array and a Laravel
// paginator (which nests the array under its own `data` key) — dig for the
// first array found rather than assuming a fixed depth.
const digArray = (payload: any): any[] => {
  let node = payload;
  for (let i = 0; i < 4 && node != null; i++) {
    if (Array.isArray(node)) return node;
    node = node.data;
  }
  return [];
};

export const transactionService = {
  getByUser: async (userId: string): Promise<Transaction[]> => {
    const response = await apiClient.get<ApiEnvelope<any>>("/table/transactions", {
      params: { user_id: userId, sort: "created_at,desc" },
    });
    return digArray(response.data) as Transaction[];
  },
};

// ─── Roles ────────────────────────────────────────────────────────────────────
// Uses /admin/roles — see API_DOCUMENTATION.md section 10.

type RoleEnvelope<T> = { success: boolean; message?: string; data: T };

export type RoleStatus = "active" | "inactive";

// Account tiers referenced elsewhere in the API (see section 5.3 "Upgrade Account")
// — these are built-in roles the backend relies on and shouldn't be deletable from the UI.
const SYSTEM_ROLE_SLUGS = new Set(["admin", "user", "agent", "bonanza", "api"]);

export type Role = {
  id: string;
  name: string;
  slug: string;
  description: string;
  usersAssigned: number;
  status: RoleStatus;
  isSystem: boolean;
};

export type RolePayload = {
  name: string;
  slug?: string;
  description: string;
  status: RoleStatus;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "role";

const mapRole = (item: any): Role => {
  const slug = String(item?.slug ?? "");
  return {
    id: String(item?.id ?? ""),
    name: item?.name ?? "",
    slug,
    description: item?.description ?? "",
    usersAssigned: Array.isArray(item?.users)
      ? item.users.length
      : Number(item?.users_count ?? 0),
    status: item?.is_active === false ? "inactive" : "active",
    isSystem: SYSTEM_ROLE_SLUGS.has(slug.toLowerCase()),
  };
};

const toRoleBody = (payload: RolePayload, existingSlug?: string) => ({
  name: payload.name,
  slug: payload.slug || existingSlug || slugify(payload.name),
  description: payload.description,
  is_active: payload.status === "active",
});

export const roleService = {
  getAll: async (): Promise<Role[]> => {
    const response = await apiClient.get<{data:RoleEnvelope<any[]>}>("/admin/roles");
    return (response.data.data.data ?? []).map(mapRole);
  },

  create: async (payload: RolePayload): Promise<Role> => {
    const response = await apiClient.post<RoleEnvelope<any>>(
      "/admin/roles",
      toRoleBody(payload),
    );
    return mapRole(response.data.data);
  },

  update: async (id: string, payload: RolePayload, existingSlug?: string): Promise<Role> => {
    const response = await apiClient.put<RoleEnvelope<any>>(
      `/admin/roles/${id}`,
      toRoleBody(payload, existingSlug),
    );
    return mapRole(response.data.data);
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/roles/${id}`);
  },
};
