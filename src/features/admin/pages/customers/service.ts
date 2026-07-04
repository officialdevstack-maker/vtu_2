import { apiClient } from "../../../../shared/api/apiClient";

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

const unwrapList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
};

const unwrapObject = (payload: any): any => {
  if (payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
    return payload.data;
  }
  if (payload?.data?.data && typeof payload.data.data === "object" && !Array.isArray(payload.data.data)) {
    return payload.data.data;
  }
  return payload;
};

const toUserPayload = (payload: CustomerPayload) => ({
  fullname: payload.name,
  username: payload.username || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12),
  email: payload.email,
  phone: payload.phone,
  password: "Password@123",
  user_type: payload.userType || "user",
  wallet_balance: payload.balance,
  status: payload.status,
});

export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    try {
      const response = await apiClient.get("/admin/users");
      return unwrapList(response.data).map(mapCustomer);
    } catch (error: any) {
      if (error?.response?.status === 404 || error?.response?.status === 401) {
        const fallback = await apiClient.get("/table/users");
        return unwrapList(fallback.data).map(mapCustomer);
      }
      throw error;
    }
  },

  create: async (payload: CustomerPayload): Promise<Customer> => {
    const response = await apiClient.post("/admin/users", toUserPayload(payload));
    return mapCustomer(unwrapObject(response.data));
  },

  update: async (id: string, payload: CustomerPayload): Promise<Customer> => {
    const response = await apiClient.put(`/admin/users/${id}`, {
      fullname: payload.name,
      email: payload.email,
      phone: payload.phone,
      wallet_balance: payload.balance,
      user_type: payload.userType || "user",
      status: payload.status,
    });
    return mapCustomer(unwrapObject(response.data));
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },

  toggleStatus: async (customer: Customer): Promise<Customer> => {
    const nextStatus = customer.status === "suspended" ? "active" : "suspended";
    const response = await apiClient.put(`/admin/users/${customer.id}`, {
      status: nextStatus,
    });
    return mapCustomer(unwrapObject(response.data));
  },
};
