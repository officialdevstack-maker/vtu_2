import { apiClient } from "@shared/api/apiClient";

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

export type SearchResultType = "customer" | "transaction" | "provider" | "data_plan" | "affiliate";

export type SearchResult = {
  type: SearchResultType;
  id: string | number;
  title: string;
  subtitle: string;
  path: string;
};

// Two different endpoints, each scoped server-side to what the caller can
// actually see (see backend/app/Http/Controllers/SearchController.php) —
// adminSearch requires user_type=admin and can see across all customers;
// userSearch only ever returns the logged-in user's own rows.
export const searchService = {
  admin: (q: string, signal?: AbortSignal): Promise<SearchResult[]> =>
    apiClient
      .get<ApiEnvelope<{ results: SearchResult[] }>>("/admin/search", {
        params: { q },
        signal,
      })
      .then((r) => r.data.data.results),

  user: (q: string, signal?: AbortSignal): Promise<SearchResult[]> =>
    apiClient
      .get<ApiEnvelope<{ results: SearchResult[] }>>("/search", {
        params: { q },
        signal,
      })
      .then((r) => r.data.data.results),
};
