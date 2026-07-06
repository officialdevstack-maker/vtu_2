import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, setAuthToken } from "../api/apiClient";
import { config } from "../config";
import type { RegisterPayload } from "@/features/auth/authService";

// Shape returned by GET /user (AuthenticatedSessionController::index), which
// loads the Eloquent User model — its $appends (transactions, banks, stats,
// referrals, joined_at) ride along on every fetch, so the dashboard needs no
// separate endpoints for wallet balance, recent transactions, or charts.
export type UserTransaction = {
  id: number;
  user_id: string;
  transaction_type: string;
  provider: string | null;
  amount: string | number;
  status: "pending" | "success" | "fail";
  transaction_reference: string;
  receiver: string | null;
  account_or_phone: string | null;
  plan_type: string | null;
  quantity?: string | number;
  service_fee?: string | number | null;
  discount_amount?: string | number | null;
  funding_method?: string | null;
  token?: string | null;
  response_message?: string | null;
  completed_at?: string | null;
  refunded_at?: string | null;
  refund_reason?: string | null;
  created_at: string;
};

export type UserStats = {
  daily_purchased_data: string;
  transaction_count: number;
  monthly_successful: number;
  monthly_failed: number;
  monthly_pending: number;
  transaction_status: { successful: number; failed: number; pending: number };
  tx_chart: { labels: string[]; datasets: { label: string; data: number[] }[] };
  tx_amount_30d: { date: string; total_amount: string | number }[];
};

export type Permission = {
  id: number;
  name: string;
  slug: string;
};

export type Role = {
  id: number;
  name: string;
  slug: string;
  permissions?: Permission[];
};

export type UserBadge = {
  event_id: number;
  name: string;
  icon: string | null;
  times_earned: number;
  last_earned_at: string | null;
};

// A dedicated virtual account number, one per active payment provider (see
// Payment::generateAccount on the backend) — transferring to this account
// credits wallet_balance automatically via that provider's webhook.
export type UserBank = {
  id: number;
  user_id: string;
  account_type: string;
  bank_account: string;
  account_name: string | null;
  bank_name: string;
  provider: string;
  status: string;
  amount?: string | number;
  charge?: string;
  logo?: string;
};

export interface User {
  id: string;
  email?: string;
  fullname?: string;
  username?: string;
  phone?: string;
  user_type?: string;
  role_id?: number;
  role?: Role | null;
  wallet_balance?: string | number;
  referral_balance?: string | number;
  referral_code?: string | null;
  has_pin?: boolean;
  transactions?: UserTransaction[];
  stats?: UserStats;
  badges?: UserBadge[];
  banks?: UserBank[];
  joined_at?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  refreshUser: () => Promise<void>;
  login: (login: string, password: string) => Promise<User | null>;
  demoLogin: (type: "user" | "admin") => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User | null>;
  logout: () => Promise<void>;
  hasPermission: (slug: string) => boolean;
}

type ApiEnvelope<T> = {
  message?: string;
  success?: boolean;
  data?: T;
  type?: string;
};

type AuthPayload = {
  user?: User;
  token?: string;
  access_token?: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

// One shared cache key for the current user everywhere in the app — the
// dashboard, transaction pages, and the account-switcher dropdown all read
// from this same cached entry instead of each holding their own copy.
export const AUTH_QUERY_KEY = ["auth", "user"] as const;
const DEMO_AUTH_KEY = "kora-demo-user";

const demoUsers: Record<"user" | "admin", User> = {
  user: {
    id: "demo-user",
    email: "demo.user@kora.test",
    fullname: "Demo Customer",
    username: "demo_customer",
    phone: "+234 800 000 1000",
    user_type: "user",
    wallet_balance: 85250,
    referral_balance: 4200,
    referral_code: "KORADEMO",
    has_pin: true,
    joined_at: "2026-01-15",
  },
  admin: {
    id: "demo-admin",
    email: "demo.admin@kora.test",
    fullname: "Demo Admin",
    username: "demo_admin",
    phone: "+234 800 000 9000",
    user_type: "admin",
    role_id: 1,
    role: {
      id: 1,
      name: "Super Admin",
      slug: "super-admin",
      permissions: [
        { id: 1, name: "Switch Account", slug: "switch_account" },
        { id: 2, name: "Manage Customers", slug: "manage_customers" },
        { id: 3, name: "Manage Products", slug: "manage_products" },
      ],
    },
    wallet_balance: 0,
    has_pin: true,
    joined_at: "2026-01-01",
  },
};

const getDemoUser = (): User | null => {
  if (typeof window === "undefined") return null;

  try {
    const storedType = window.localStorage.getItem(DEMO_AUTH_KEY);
    return storedType === "user" || storedType === "admin"
      ? demoUsers[storedType]
      : null;
  } catch {
    return null;
  }
};

const setDemoUser = (type: "user" | "admin") => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_AUTH_KEY, type);
};

const clearDemoUser = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_AUTH_KEY);
};

const fetchCurrentUser = async (): Promise<User | null> => {
  const demoUser = getDemoUser();
  if (demoUser) return demoUser;

  try {
    const response = await apiClient.get("/user");
    return response.data.data?.user ?? null;
  } catch {
    return null;
  }
};

const persistAuthToken = (payload?: AuthPayload | null) => {
  const token = payload?.token ?? payload?.access_token;
  if (token) {
    setAuthToken(token);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const { data: user = null, isLoading: isInitializing } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
  });

  const login = useCallback(
    async (loginValue: string, password: string) => {
      setIsLoading(true);
      try {
        clearDemoUser();
        setAuthToken(null);
        await apiClient.get("/sanctum/csrf-cookie");
        const response = await apiClient.post<ApiEnvelope<AuthPayload>>("/login", { login: loginValue, password });
        persistAuthToken(response.data.data);
        const freshUser = (await fetchCurrentUser()) ?? response.data.data?.user ?? null;
        queryClient.setQueryData(AUTH_QUERY_KEY, freshUser);
        return freshUser;
      } catch (error: any) {
        console.error("Login failed:", error?.response?.data ?? error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient],
  );

  const demoLogin = useCallback(
    async (type: "user" | "admin") => {
      setIsLoading(true);
      try {
        setAuthToken(null);
        setDemoUser(type);
        const demoUser = demoUsers[type];
        queryClient.setQueryData(AUTH_QUERY_KEY, demoUser);
        return demoUser;
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsLoading(true);
      try {
        clearDemoUser();
        setAuthToken(null);
        await apiClient.get("/sanctum/csrf-cookie");
        const response = await apiClient.post<ApiEnvelope<AuthPayload>>("/register", payload);
        persistAuthToken(response.data.data);
        const freshUser = (await fetchCurrentUser()) ?? response.data.data?.user ?? null;
        queryClient.setQueryData(AUTH_QUERY_KEY, freshUser);
        return freshUser;
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.post(config.auth.routes.logout);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Clear everything, not just the user entry — a customer's cached
      // dashboard/transactions data must not leak into the next session on
      // this device (e.g. a shared computer, or switching accounts).
      queryClient.clear();
      clearDemoUser();
      setAuthToken(null);
      setIsLoading(false);
    }
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
  }, [queryClient]);

  const hasPermission = useCallback(
    (slug: string) => user?.role?.permissions?.some((p) => p.slug === slug) ?? false,
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isInitializing,
        refreshUser,
        login,
        demoLogin,
        register,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
