import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiClient,
  getAuthToken,
  isNativeClient,
  postToNative,
  primeCsrfProtection,
  setAuthToken,
} from "../api/apiClient";
import { clearCatalogRequestCache } from "../api/catalogCache";
import { clearImpersonation } from "../impersonation";
import { config } from "../config";
import type { RegisterPayload } from "@/features/auth/authService";
import { SessionExpiryModal } from "../components/session-expiry-modal";

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
  monthly_deposits?: number;
  monthly_purchases?: number;
  today_spend?: number;
  today_data_gb?: number;
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
  login: (login: string, password: string, remember?: boolean) => Promise<User | null>;
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
  refresh_token?: string;
  expires_in?: number;
  session?: AuthSessionInfo;
  verification_email_sent?: boolean;
};

export type AuthSessionInfo = {
  id: string;
  channel: string;
  device_name: string;
  expires_at: string | null;
  current?: boolean;
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
  | { type: "logout" }
  | { type: "session-expiry"; expiresAt: string };

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

const fetchCurrentUser = async (signal?: AbortSignal): Promise<User | null> => {
  try {
    const response = await apiClient.get("/user", {
      signal,
    });
    const payload = response.data.data as AuthPayload | undefined;
    if (payload?.session?.expires_at && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vendify:session-expiry-updated", { detail: payload.session.expires_at }));
    }
    return payload?.user ?? null;
  } catch (error) {
    // Let TanStack Query recognise an unmount/navigation cancellation. Turning
    // an aborted request into `null` would incorrectly cache a logged-out user.
    if (signal?.aborted) throw error;
    return null;
  }
};

const persistAuthToken = (payload?: AuthPayload | null) => {
  const token = payload?.token ?? payload?.access_token;
  if (token && isNativeClient()) {
    setAuthToken(token);
    postToNative({
      type: "vendify-auth-credentials",
      accessToken: token,
      refreshToken: payload?.refresh_token,
      expiresIn: payload?.expires_in,
      session: payload?.session,
      storage: "secure-keychain-required",
    });
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [nativeReady, setNativeReady] = useState(() => !isNativeClient() || Boolean(getAuthToken()));
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isExtending, setIsExtending] = useState(false);
  const lastExtensionAt = useRef(0);
  const expiringRef = useRef(false);

  const { data: user = null, isLoading: isLoadingUser } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    enabled: nativeReady,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!canUseAuthChannel()) {
      return;
    }

    let channel: BroadcastChannel;
    try {
      channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    } catch {
      return;
    }

    channel.onmessage = (event: MessageEvent<AuthChannelMessage>) => {
      const message = event.data;

      if (message.type === "logout") {
        queryClient.clear();
        clearCatalogRequestCache();
        setAuthToken(null);
        clearImpersonation();
        setExpiresAt(null);
        return;
      }

      if (message.type === "session-expiry") {
        const timestamp = Date.parse(message.expiresAt);
        if (Number.isFinite(timestamp)) setExpiresAt(timestamp);
      }
    };

    return () => {
      channel.close();
    };
  }, [queryClient]);

  const isInitializing = !nativeReady || isLoadingUser;

  useEffect(() => {
    if (!isNativeClient()) return;
    const handleToken = () => {
      setNativeReady(Boolean(getAuthToken()));
      if (getAuthToken()) void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    };
    window.addEventListener("vendify:native-token-updated", handleToken);
    postToNative({ type: "vendify-auth-state-required" });
    return () => window.removeEventListener("vendify:native-token-updated", handleToken);
  }, [queryClient]);

  useEffect(() => {
    const handleExpiry = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      const timestamp = Date.parse(value);
      if (!Number.isFinite(timestamp)) return;
      setExpiresAt(timestamp);
      postAuthMessage({ type: "session-expiry", expiresAt: value });
    };
    window.addEventListener("vendify:session-expiry-updated", handleExpiry);
    return () => window.removeEventListener("vendify:session-expiry-updated", handleExpiry);
  }, []);

  const login = useCallback(
    async (loginValue: string, password: string, remember = false) => {
      setIsLoading(true);
      try {
        setAuthToken(null);
        // Also guards the path where a session ends without logout() running
        // (an expired token, or navigating straight to /login client-side).
        clearCatalogRequestCache();
        await primeCsrfProtection(true);
        const response = await apiClient.post<ApiEnvelope<AuthPayload>>("/login", {
          login: loginValue,
          password,
          remember,
          client_type: isNativeClient() ? "mobile" : "web",
        });
        persistAuthToken(response.data.data);
        const sessionExpiry = response.data.data?.session?.expires_at;
        if (sessionExpiry) {
          window.dispatchEvent(new CustomEvent("vendify:session-expiry-updated", { detail: sessionExpiry }));
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
        await primeCsrfProtection(true);
        const response = await apiClient.post<ApiEnvelope<AuthPayload>>("/register", {
          ...payload,
          client_type: isNativeClient() ? "mobile" : "web",
        });
        persistAuthToken(response.data.data);
        const sessionExpiry = response.data.data?.session?.expires_at;
        if (sessionExpiry) {
          window.dispatchEvent(new CustomEvent("vendify:session-expiry-updated", { detail: sessionExpiry }));
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

  const expireSession = useCallback(() => {
    if (!user || expiringRef.current) return;
    expiringRef.current = true;
    const intended = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (!window.location.pathname.startsWith("/login")) {
      window.sessionStorage.setItem("vendify-intended-path", intended);
    }
    queryClient.clear();
    clearCatalogRequestCache();
    setAuthToken(null);
    clearImpersonation();
    setExpiresAt(null);
    postAuthMessage({ type: "logout" });
    const redirect = () => window.location.assign("/login?reason=session-expired");
    const fallback = window.setTimeout(redirect, 1500);
    void apiClient.post("/logout", undefined, { timeout: 1200 }).finally(() => {
      window.clearTimeout(fallback);
      redirect();
    });
  }, [queryClient, user]);

  const extendSession = useCallback(async () => {
    if (isNativeClient() || isExtending) return;
    setIsExtending(true);
    try {
      const response = await apiClient.post<ApiEnvelope<{ session?: AuthSessionInfo }>>("/session/extend");
      const nextExpiry = response.data.data?.session?.expires_at;
      if (nextExpiry) {
        lastExtensionAt.current = Date.now();
        window.dispatchEvent(new CustomEvent("vendify:session-expiry-updated", { detail: nextExpiry }));
      }
    } finally {
      setIsExtending(false);
    }
  }, [isExtending]);

  useEffect(() => {
    const handleExpired = () => expireSession();
    window.addEventListener("vendify:session-expired", handleExpired);
    return () => window.removeEventListener("vendify:session-expired", handleExpired);
  }, [expireSession]);

  useEffect(() => {
    if (!user || !expiresAt || isNativeClient()) {
      return;
    }

    const tick = () => {
      const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setCountdown(seconds <= 120 ? seconds : null);
      if (seconds === 0) expireSession();
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, expireSession, user]);

  useEffect(() => {
    if (!user || !expiresAt || isNativeClient()) return;
    const handleActivity = () => {
      const remaining = expiresAt - Date.now();
      const extensionDue = Date.now() - lastExtensionAt.current > 5 * 60_000;
      if (remaining > 120_000 && remaining < 25 * 60_000 && extensionDue) {
        void extendSession();
      }
    };
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    return () => events.forEach((event) => window.removeEventListener(event, handleActivity));
  }, [expiresAt, extendSession, user]);

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
      clearCatalogRequestCache();
      setAuthToken(null);
      postAuthMessage({ type: "logout" });
      // A plain logout during an impersonation session must also drop the
      // parked admin token, or the next login would show the banner again.
      clearImpersonation();
      setExpiresAt(null);
      postToNative({ type: "vendify-auth-cleared" });
      setIsLoading(false);
    }
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["customer", "dashboard"] }),
    ]);
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
      {user && countdown !== null && countdown <= 120 ? (
        <SessionExpiryModal seconds={countdown} extending={isExtending} onStaySignedIn={() => void extendSession()} />
      ) : null}
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
