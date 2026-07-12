import { QueryClient } from "@tanstack/react-query";

// Catalog-style queries: server data that changes on admin action, not per
// user or per minute (plan lists, network lists, bank lists, site settings).
// These are safe to treat as fresh for a long time and to persist across
// page reloads — a stale plan list is corrected on the next background
// refetch, and purchases are validated server-side anyway.
//
// Listed as top-level query-key prefixes; used both for the longer
// staleTime below and as the persistence whitelist in main.tsx (user- and
// admin-specific data deliberately never touches localStorage).
export const CATALOG_QUERY_KEYS = [
  "general-settings",
  "networks",
  "data-plans",
  "airtime-plans",
  "cable-plans",
  "cable-networks",
  "bill-plans",
  "upgrade-tiers",
  "wallet-withdrawal-banks",
] as const;

const CATALOG_STALE_TIME = 30 * 60 * 1000;
// gcTime must outlive staleTime, and must be >= the persister maxAge so a
// restored-from-localStorage entry isn't immediately garbage-collected.
const CATALOG_GC_TIME = 24 * 60 * 60 * 1000;

// One shared client for the whole app. Defaults tuned for an admin/customer
// dashboard, not a live feed: data is treated as fresh for a minute (no
// refetch storm on every tab focus/remount), kept around for 5 minutes after
// its last observer unmounts (so navigating back to a page — or switching
// between admin/user view — is instant from cache), and a failed query
// retries once rather than the default three (most failures here are auth
// 401/403s that a retry won't fix).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

for (const key of CATALOG_QUERY_KEYS) {
  queryClient.setQueryDefaults([key], {
    staleTime: CATALOG_STALE_TIME,
    gcTime: CATALOG_GC_TIME,
  });
}

export const isCatalogQueryKey = (queryKey: readonly unknown[]): boolean =>
  typeof queryKey[0] === "string" &&
  (CATALOG_QUERY_KEYS as readonly string[]).includes(queryKey[0]);
