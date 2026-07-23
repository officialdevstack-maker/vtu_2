import { dehydrate, hydrate, type QueryClient } from "@tanstack/react-query";
import { isPersistableCatalogQueryKey } from "./queryClient";

const STORAGE_KEY = "vtu-query-cache";
const BUSTER = "v3";
const MAX_AGE = 5 * 60 * 1000;

type PersistedQueryCache = {
  buster: string;
  timestamp: number;
  clientState: ReturnType<typeof dehydrate>;
};

const readCache = (): PersistedQueryCache | null => {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as PersistedQueryCache | null;
    if (
      !parsed ||
      parsed.buster !== BUSTER ||
      Date.now() - parsed.timestamp > MAX_AGE
    ) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const restorePersistedCatalog = (queryClient: QueryClient) => {
  const persisted = readCache();
  if (persisted) hydrate(queryClient, persisted.clientState);
};

export const persistCatalogInBackground = (queryClient: QueryClient) => {
  let scheduled = false;
  const persist = () => {
    scheduled = false;
    try {
      const clientState = dehydrate(queryClient, {
        shouldDehydrateQuery: (query) =>
          query.state.status === "success" &&
          isPersistableCatalogQueryKey(query.queryKey),
      });
      const payload: PersistedQueryCache = {
        buster: BUSTER,
        timestamp: Date.now(),
        clientState,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Storage can be unavailable or full. In-memory caching still works.
    }
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(persist, { timeout: 1_500 });
    } else {
      globalThis.setTimeout(persist, 250);
    }
  };

  return queryClient.getQueryCache().subscribe((event) => {
    if (
      event?.query &&
      isPersistableCatalogQueryKey(event.query.queryKey) &&
      event.query.state.status === "success"
    ) {
      schedule();
    }
  });
};
