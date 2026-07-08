import { apiClient, getAuthToken, setAuthToken } from "./api/apiClient";

// Admin-side "sign in as customer": the admin's own token is parked in
// localStorage while the impersonation token takes its place, and restored
// when the session ends. Both transitions do a full page load on purpose —
// every cached query (auth user, wallet, transactions, branding) must be
// rebuilt under the other identity, and a hard navigation guarantees that
// more reliably than chasing down each cache.
const ADMIN_TOKEN_BACKUP_KEY = "kora-admin-token-backup";
const RETURN_PATH_KEY = "kora-impersonation-return";

export const isImpersonating = (): boolean => {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(ADMIN_TOKEN_BACKUP_KEY));
};

export function startImpersonation(token: string, returnPath: string): void {
  const adminToken = getAuthToken();
  if (adminToken) {
    window.localStorage.setItem(ADMIN_TOKEN_BACKUP_KEY, adminToken);
  }
  window.localStorage.setItem(RETURN_PATH_KEY, returnPath);
  setAuthToken(token);
  window.location.assign("/dashboard");
}

export async function stopImpersonation(): Promise<void> {
  try {
    // Revoke the impersonation token so it can't be replayed later.
    await apiClient.post("/logout");
  } catch {
    // Already dead/expired — still restore the admin session below.
  }
  const adminToken = window.localStorage.getItem(ADMIN_TOKEN_BACKUP_KEY);
  const returnPath =
    window.localStorage.getItem(RETURN_PATH_KEY) || "/admin/customers/users";
  clearImpersonation();
  setAuthToken(adminToken);
  window.location.assign(adminToken ? returnPath : "/login");
}

// Drop the parked admin token without restoring it — used when the session
// ends some other way (e.g. the impersonated user hits the normal Logout
// button), so a later login doesn't wrongly show the impersonation banner.
export function clearImpersonation(): void {
  window.localStorage.removeItem(ADMIN_TOKEN_BACKUP_KEY);
  window.localStorage.removeItem(RETURN_PATH_KEY);
}
