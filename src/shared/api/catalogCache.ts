// A short-lived, module-level memo in front of the catalog endpoints, so the
// several components that mount at once (buy-data, buy-airtime, the network
// picker) share one in-flight request instead of each firing their own.
//
// It sits *below* React Query — a queryFn that calls memoizedCatalogRequest
// can be handed a cached response without any network request at all — so
// queryClient.clear() alone does NOT empty it. Anything that changes identity
// must call clearCatalogRequestCache(), or the next account reads the previous
// account's responses: catalog endpoints look impersonal, but their prices are
// resolved per role server-side (see DataPlan::getPriceAttribute).
const catalogRequestCache = new Map<string, { expiresAt: number; promise: Promise<unknown> }>();

export const memoizedCatalogRequest = <T>(
  cacheKey: string,
  request: () => Promise<T>,
  ttlMs = 60_000,
): Promise<T> => {
  const cachedEntry = catalogRequestCache.get(cacheKey);
  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cachedEntry.promise as Promise<T>;
  }

  const promise = request()
    .then((data) => {
      catalogRequestCache.set(cacheKey, {
        expiresAt: Date.now() + ttlMs,
        promise: Promise.resolve(data),
      });
      return data;
    })
    .catch((error) => {
      catalogRequestCache.delete(cacheKey);
      throw error;
    });

  catalogRequestCache.set(cacheKey, {
    expiresAt: Date.now() + ttlMs,
    promise,
  });

  return promise;
};

export const clearCatalogRequestCache = (): void => {
  catalogRequestCache.clear();
};
