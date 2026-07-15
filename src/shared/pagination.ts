import { useCallback, useEffect, useMemo, useState } from "react";

export const DEFAULT_PAGE_SIZE = 10;

/**
 * Paginate a client-side list.
 *
 * Uncontrolled (the default): the hook owns the page number.
 * Controlled: pass `onPageChange` and the page is driven entirely by
 * `initialPage` — used with useTableQueryState to keep the page in the URL.
 */
export function usePagination<T>(
  items: T[],
  pageSize = DEFAULT_PAGE_SIZE,
  initialPage = 1,
  onPageChange?: (page: number) => void,
) {
  const isControlled = typeof onPageChange === "function";
  const [internalPage, setInternalPage] = useState(initialPage);

  // In controlled mode `initialPage` IS the page, so there is nothing to sync.
  useEffect(() => {
    if (!isControlled) setInternalPage(initialPage);
  }, [initialPage, isControlled]);

  const page = isControlled ? initialPage : internalPage;

  const setPage = useCallback(
    (next: number) => {
      if (isControlled) onPageChange(next);
      else setInternalPage(next);
    },
    [isControlled, onPageChange],
  );

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(currentPage * pageSize, totalItems);
  const pageItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [endIndex, items, startIndex],
  );

  return {
    currentPage,
    endIndex,
    pageItems,
    pageSize,
    setPage,
    startIndex,
    totalItems,
    totalPages,
  };
}
