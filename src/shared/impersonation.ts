import { apiClient } from "./api/apiClient";

// Admin-side "sign in as customer" is a server-side session switch. Only a
// non-sensitive UI marker and return path live in this tab. Both transitions
// do a full page load on purpose —
// every cached query (auth user, wallet, transactions, branding) must be
// rebuilt under the other identity, and a hard navigation guarantees that
// more reliably than chasing down each cache.
const IMPERSONATION_MARKER_KEY = "vendify-impersonation-active";
const RETURN_PATH_KEY = "kora-impersonation-return";

export const isImpersonating = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(IMPERSONATION_MARKER_KEY) === "1";
};

export function startImpersonation(returnPath: string): void {
  window.sessionStorage.setItem(IMPERSONATION_MARKER_KEY, "1");
  window.sessionStorage.setItem(RETURN_PATH_KEY, returnPath);
  window.location.assign("/dashboard");
}

export async function stopImpersonation(): Promise<void> {
  try {
    await apiClient.post("/impersonation/stop");
  } catch {
    // Already dead/expired — still restore the admin session below.
  }
  const returnPath =
    window.sessionStorage.getItem(RETURN_PATH_KEY) || "/admin/customers/users";
  clearImpersonation();
  window.location.assign(returnPath);
}

// Drop the parked admin token without restoring it — used when the session
// ends some other way (e.g. the impersonated user hits the normal Logout
// button), so a later login doesn't wrongly show the impersonation banner.
export function clearImpersonation(): void {
  window.sessionStorage.removeItem(IMPERSONATION_MARKER_KEY);
  window.sessionStorage.removeItem(RETURN_PATH_KEY);
  // Remove credentials left by pre-session-security builds.
  window.localStorage.removeItem("kora-admin-token-backup");
}
