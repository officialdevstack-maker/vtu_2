import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/apiClient";
import { config } from "../config";

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

interface User {
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
  transactions?: UserTransaction[];
  stats?: UserStats;
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
  logout: () => Promise<void>;
  hasPermission: (slug: string) => boolean;
  // TEMPORARY DEMO ACCESS — remove loginAsDemo (and its callers) once real
  // auth is wired up everywhere. Seeds a fake user into the query cache so
  // ProtectedLayout and the dashboard render without a live backend.
  loginAsDemo: () => void;
}

const DEMO_USER: User = {
  id: "demo-user",
  email: "demo@kora.app",
  fullname: "Demo User",
  username: "demo",
  phone: "08012345678",
  user_type: "customer",
  wallet_balance: 25000,
  referral_balance: 500,
  referral_code: "DEMO2026",
  transactions: [],
  stats: {
    daily_purchased_data: "0",
    transaction_count: 0,
    monthly_successful: 0,
    monthly_failed: 0,
    monthly_pending: 0,
    transaction_status: { successful: 0, failed: 0, pending: 0 },
    tx_chart: { labels: [], datasets: [] },
    tx_amount_30d: [],
  },
  joined_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | null>(null);

// One shared cache key for the current user everywhere in the app — the
// dashboard, transaction pages, and the account-switcher dropdown all read
// from this same cached entry instead of each holding their own copy.
export const AUTH_QUERY_KEY = ["auth", "user"] as const;

const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await apiClient.get("/user");
    return response.data.data?.user ?? null;
  } catch {
    return null;
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
        await apiClient.get("/sanctum/csrf-cookie");
        await apiClient.post("/login", { login: loginValue, password });
        const freshUser = await fetchCurrentUser();
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

  // TEMPORARY DEMO ACCESS — see AuthContextType.loginAsDemo above.
  const loginAsDemo = useCallback(() => {
    queryClient.setQueryData(AUTH_QUERY_KEY, DEMO_USER);
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isInitializing,
        refreshUser,
        login,
        logout,
        hasPermission,
        loginAsDemo,
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
