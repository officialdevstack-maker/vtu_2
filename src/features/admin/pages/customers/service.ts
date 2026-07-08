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
  roleId?: string | null;
  roleName?: string | null;
};

export type CustomerPayload = {
  name: string;
  email: string;
  phone: string;
  username?: string;
  roleId?: string | null;
  status?: CustomerStatus;
  // Required on create; optional on update (blank = keep current password).
  password?: string;
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
  roleId:
    item?.role_id != null
      ? String(item.role_id)
      : item?.role?.id != null
        ? String(item.role.id)
        : null,
  // index/show eager-load the role relation; fall back to user_type for
  // payloads that don't carry it (e.g. the /table/users fallback).
  roleName: item?.role?.name ?? item?.user_type ?? null,
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

const toCreatePayload = (payload: CustomerPayload) => ({
  fullname: payload.name,
  username: payload.username || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12),
  email: payload.email,
  phone: payload.phone,
  password: payload.password,
  // The backend defaults to the "basic" role when omitted, and derives
  // user_type from the role itself (see UserController::userTypeForRole).
  ...(payload.roleId ? { role_id: payload.roleId } : {}),
});

// wallet_balance is intentionally never sent — balance changes go through
// POST /admin/users/{id}/fund so every change has a transaction record.
const toUpdatePayload = (payload: CustomerPayload) => ({
  fullname: payload.name,
  username: payload.username,
  email: payload.email,
  phone: payload.phone,
  ...(payload.roleId ? { role_id: payload.roleId } : {}),
  ...(payload.status ? { status: payload.status } : {}),
  ...(payload.password ? { password: payload.password } : {}),
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
    return mapCustomer(digUser(response.data));
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`${USERS}/${id}`);
  },

  toggleStatus: async (customer: Customer): Promise<Customer> => {
    const nextStatus = customer.status === "suspended" ? "active" : "suspended";
    const response = await apiClient.put<ApiEnvelope<any>>(`${USERS}/${customer.id}`, {
      status: nextStatus,
    });
    return mapCustomer(digUser(response.data));
  },

  // POST /admin/users/{id}/fund — see API_DOCUMENTATION.md section 7.3.
  fundWallet: async (id: string, amount: number, type: "credit" | "debit"): Promise<Customer> => {
    const response = await apiClient.post<ApiEnvelope<any>>(`${USERS}/${id}/fund`, {
      amount,
      type,
    });
    return mapCustomer(digUser(response.data));
  },

  // Issues a login token for the customer so the admin can browse the app as
  // them — see UserController::impersonate. The caller hands the token to
  // startImpersonation(), which parks the admin session and reloads.
  impersonate: async (id: string): Promise<string> => {
    const response = await apiClient.post<ApiEnvelope<any>>(`${USERS}/${id}/impersonate`);
    let node: any = response.data;
    for (let i = 0; i < 4 && node != null; i++) {
      if (typeof node.token === "string") return node.token;
      node = node.data;
    }
    throw new Error("The impersonation response did not include a token.");
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
  // Only present when the request passes ?with=user.
  user?: { id: number; fullname: string; email: string } | null;
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

  // Most recent transactions across all users, with the owning user attached
  // (see TransactionResource::toArray()'s whenLoaded('user')).
  getRecent: async (limit = 8): Promise<Transaction[]> => {
    const response = await apiClient.get<ApiEnvelope<any>>("/table/transactions", {
      params: { sort: "created_at,desc", with: "user" },
    });
    return (digArray(response.data) as Transaction[]).slice(0, limit);
  },
};

// ─── Roles ────────────────────────────────────────────────────────────────────
// Uses /admin/roles — see API_DOCUMENTATION.md section 10.

type RoleEnvelope<T> = { success: boolean; message?: string; data: T };

export type RoleStatus = "active" | "inactive";

// Built-in roles the backend relies on (seeded staff roles + pricing tiers) —
// RoleController::destroy refuses to delete these; the UI disables the option
// up front. Keep in sync with RoleController::PROTECTED_SLUGS.
const SYSTEM_ROLE_SLUGS = new Set([
  "owner", "co-owner", "customer-care", "admin", "user",
  "agent", "bonanza", "api", "basic",
]);

// Real, backend-defined permissions (App\Models\Permission) — distinct from
// the old locally-faked PermissionGroup list that was never sent to the API.
export type Permission = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type Role = {
  id: string;
  name: string;
  slug: string;
  description: string;
  usersAssigned: number;
  status: RoleStatus;
  isSystem: boolean;
  permissions: Permission[];
  // Whether a customer can self-upgrade into this role from
  // /upgrade-account, and what it costs — see CustomerController::upgrade.
  upgradable: boolean;
  upgradeCost: number | null;
};

export type RolePayload = {
  name: string;
  slug?: string;
  description: string;
  status: RoleStatus;
  permissionIds: string[];
  upgradable: boolean;
  upgradeCost: number | null;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "role";

const mapPermission = (item: any): Permission => ({
  id: String(item?.id ?? ""),
  // Legacy rows carry a display name ("Customers"); rows created by the
  // current seeder may only have the machine key — fall back to slug.
  name: item?.name ?? item?.slug ?? "",
  slug: item?.slug ?? item?.name ?? "",
  description: item?.description ?? "",
});

// RoleController wraps responses in the app envelope with a named key:
// { success, message, data: { roles: [...] } } (and data.role / data.permissions
// for the other endpoints) — dig for the named key rather than assuming
// data itself is the array.
const digNamedArray = (payload: any, key: string): any[] => {
  let node = payload;
  for (let i = 0; i < 4 && node != null; i++) {
    if (Array.isArray(node[key])) return node[key];
    if (Array.isArray(node)) return node;
    node = node.data;
  }
  return [];
};

const digRole = (payload: any): any => {
  let node = payload;
  for (let i = 0; i < 4 && node != null; i++) {
    if (node.role) return node.role;
    if (node.id != null && node.name != null) return node;
    node = node.data;
  }
  return node ?? {};
};

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
    permissions: Array.isArray(item?.permissions) ? item.permissions.map(mapPermission) : [],
    upgradable: Boolean(item?.upgradable),
    upgradeCost: item?.upgrade_cost != null ? Number(item.upgrade_cost) : null,
  };
};

const toRoleBody = (payload: RolePayload, existingSlug?: string) => ({
  name: payload.name,
  slug: payload.slug || existingSlug || slugify(payload.name),
  description: payload.description,
  is_active: payload.status === "active",
  permission_ids: payload.permissionIds,
  upgradable: payload.upgradable,
  upgrade_cost: payload.upgradable ? payload.upgradeCost : null,
});

export const permissionService = {
  getAll: async (): Promise<Permission[]> => {
    const response = await apiClient.get<RoleEnvelope<any>>("/admin/permissions");
    return digNamedArray(response.data, "permissions").map(mapPermission);
  },
};

export const roleService = {
  getAll: async (): Promise<Role[]> => {
    const response = await apiClient.get<RoleEnvelope<any>>("/admin/roles");
    return digNamedArray(response.data, "roles").map(mapRole);
  },

  getById: async (id: string): Promise<Role> => {
    const response = await apiClient.get<RoleEnvelope<any>>(`/admin/roles/${id}`);
    return mapRole(digRole(response.data));
  },

  create: async (payload: RolePayload): Promise<Role> => {
    const response = await apiClient.post<RoleEnvelope<any>>(
      "/admin/roles",
      toRoleBody(payload),
    );
    return mapRole(digRole(response.data));
  },

  update: async (id: string, payload: RolePayload, existingSlug?: string): Promise<Role> => {
    const response = await apiClient.put<RoleEnvelope<any>>(
      `/admin/roles/${id}`,
      toRoleBody(payload, existingSlug),
    );
    return mapRole(digRole(response.data));
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/roles/${id}`);
  },
};
