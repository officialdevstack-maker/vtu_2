import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
  useEffect,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, getAuthToken, setAuthToken } from "../api/apiClient";
import { clearImpersonation } from "../impersonation";
import { config } from "../config";
import type { RegisterPayload } from "@/features/auth/authService";

// Shape returned by GET /user. The default auth check stays lightweight;
// customer dashboard-only fields are fetched by the dashboard when needed.
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
  register: (payload: RegisterPayload) => Promise<RegistrationResult>;
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
  verification_email_sent?: boolean;
};

export type RegistrationResult = {
  user: User | null;
  verificationEmailSent: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_CHANNEL_NAME = "vendify-auth-session";
const canUseAuthChannel = () =>
  typeof window !== "undefined" && "BroadcastChannel" in window;

type AuthChannelMessage =
  | { type: "request-token" }
  | { type: "token-response"; token: string }
  | { type: "logout" };

// One shared cache key for the current user everywhere in the app — the
// dashboard, transaction pages, and the account-switcher dropdown all read
// from this same cached entry instead of each holding their own copy.
export const AUTH_QUERY_KEY = ["auth", "user"] as const;

const postAuthMessage = (message: AuthChannelMessage) => {
  if (!canUseAuthChannel()) return;
  try {
    const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    channel.postMessage(message);
    channel.close();
  } catch {
    // Some Safari/privacy contexts expose BroadcastChannel but reject its
    // construction. Cross-tab sync is optional; authentication is not.
  }
};

const fetchCurrentUser = async (): Promise<User | null> => {
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
  const [hasToken, setHasToken] = useState(() => Boolean(getAuthToken()));
  const [isSyncingToken, setIsSyncingToken] = useState(
    () => !getAuthToken() && canUseAuthChannel(),
  );

  const { data: user = null, isLoading: isLoadingUser } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    enabled: hasToken,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!canUseAuthChannel()) {
      setIsSyncingToken(false);
      return;
    }

    let channel: BroadcastChannel;
    try {
      channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    } catch {
      setIsSyncingToken(false);
      return;
    }
    const fallbackTimer = window.setTimeout(() => {
      setIsSyncingToken(false);
    }, 700);

    channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
      const message = event.data;

      if (message.type === "request-token") {
        const token = getAuthToken();
        if (token) {
          channel.postMessage({ type: "token-response", token });
        }
        return;
      }

      if (message.type === "token-response") {
        if (!getAuthToken() && message.token) {
          setAuthToken(message.token);
          setHasToken(true);
          setIsSyncingToken(false);
          void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
        }
        return;
      }

      if (message.type === "logout") {
        queryClient.clear();
        setAuthToken(null);
        setHasToken(false);
        setIsSyncingToken(false);
        clearImpersonation();
      }
    };

    if (!getAuthToken()) {
      channel.postMessage({ type: "request-token" });
    }

    return () => {
      window.clearTimeout(fallbackTimer);
      channel.close();
    };
  }, [queryClient]);

  const isInitializing = isSyncingToken || isLoadingUser;

  const login = useCallback(
    async (loginValue: string, password: string) => {
      setIsLoading(true);
      try {
        setAuthToken(null);
        await apiClient.get("/sanctum/csrf-cookie");
        const response = await apiClient.post<ApiEnvelope<AuthPayload>>("/login", { login: loginValue, password });
        persistAuthToken(response.data.data);
        if (response.data.data?.token || response.data.data?.access_token) {
          setHasToken(true);
          postAuthMessage({
            type: "token-response",
            token: response.data.data.token ?? response.data.data.access_token ?? "",
          });
        }
        const freshUser = response.data.data?.user ?? null;
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

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setIsLoading(true);
      try {
        setAuthToken(null);
        await apiClient.get("/sanctum/csrf-cookie");
        const response = await apiClient.post<ApiEnvelope<AuthPayload>>("/register", payload);
        persistAuthToken(response.data.data);
        if (response.data.data?.token || response.data.data?.access_token) {
          setHasToken(true);
          postAuthMessage({
            type: "token-response",
            token: response.data.data.token ?? response.data.data.access_token ?? "",
          });
        }
        const freshUser = response.data.data?.user ?? null;
        queryClient.setQueryData(AUTH_QUERY_KEY, freshUser);
        return {
          user: freshUser,
          verificationEmailSent: response.data.data?.verification_email_sent === true,
        };
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
      setAuthToken(null);
      setHasToken(false);
      postAuthMessage({ type: "logout" });
      // A plain logout during an impersonation session must also drop the
      // parked admin token, or the next login would show the banner again.
      clearImpersonation();
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
