import { QueryClient } from "@tanstack/react-query";

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
