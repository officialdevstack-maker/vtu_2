import { useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Keeps a table's search/filter/sort/page state in the URL instead of local
 * component state, so a refresh, a back-navigation, or a shared link all land
 * on the same view — no re-applying the same filters over and over.
 *
 * Usage:
 *   const { state, set, reset, isDirty } = useTableQueryState({
 *     q: "", network: "", status: "", sort: "network", dir: "asc", page: 1,
 *   });
 *
 * Design notes:
 *  - Only non-default values are written to the URL, so a pristine table has a
 *    clean address bar and defaults can change later without stale links.
 *  - Unrelated params (e.g. the `?tab=` a tabbed page owns) are preserved.
 *  - Updates use history.replace, so typing in a search box doesn't push a
 *    hundred entries onto the back stack.
 *  - Changing any filter resets `page` to its default automatically (see
 *    `pageKey`), which is what every table here did by hand with an effect.
 */
type Primitive = string | number | boolean;

type Options<T> = {
  /**
   * Namespace for the param names, for pages that show more than one table at
   * once (e.g. `prefix: "plans"` yields `?plans_q=`). Omit when a page only has
   * one table — including tabbed pages, since only one tab renders at a time.
   */
  prefix?: string;
  /**
   * Key holding the current page. Changing any *other* key resets it to its
   * default. Pass null to disable that behaviour.
   */
  pageKey?: keyof T | null;
};

/** Read a raw param back into the type its default implies. */
function decode<V extends Primitive>(raw: string, fallback: V): V {
  if (typeof fallback === "number") {
    const n = Number(raw);
    return (Number.isFinite(n) ? n : fallback) as V;
  }
  if (typeof fallback === "boolean") {
    return (raw === "1" || raw === "true") as V;
  }
  return raw as V;
}

function encode(value: Primitive): string {
  return typeof value === "boolean" ? (value ? "1" : "0") : String(value);
}

export function useTableQueryState<T extends Record<string, Primitive>>(
  defaults: T,
  options: Options<T> = {},
) {
  const { prefix = "", pageKey = "page" as keyof T } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  // Callers pass `defaults` as an inline literal, so its identity changes every
  // render. Pinning it on first render keeps the memos below stable — defaults
  // are a fixed description of the table, never runtime state.
  const defaultsRef = useRef(defaults);
  defaults = defaultsRef.current;

  const paramName = useCallback(
    (key: keyof T) => `${prefix}${String(key)}`,
    [prefix],
  );

  // The URL is the source of truth; anything absent falls back to its default.
  const state = useMemo(() => {
    const next = {} as T;
    for (const key of Object.keys(defaults) as Array<keyof T>) {
      const raw = searchParams.get(paramName(key));
      next[key] = raw === null ? defaults[key] : decode(raw, defaults[key]);
    }
    return next;
  }, [searchParams, defaults, paramName]);

  const set = useCallback(
    (patch: Partial<T>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);

          // Merge against the params as they are *right now* rather than the
          // `state` captured at render, so two set() calls in one tick don't
          // clobber each other. It also keeps this callback referentially
          // stable, which matters when it's passed to usePagination.
          const live = {} as T;
          for (const key of Object.keys(defaults) as Array<keyof T>) {
            const raw = current.get(paramName(key));
            live[key] = raw === null ? defaults[key] : decode(raw, defaults[key]);
          }
          const merged = { ...live, ...patch } as T;

          // Any change other than paging means the current page number is
          // meaningless against the new result set — go back to page one.
          const changedOtherKey = Object.keys(patch).some(
            (k) => pageKey !== null && k !== String(pageKey),
          );
          if (changedOtherKey && pageKey !== null) {
            merged[pageKey] = defaults[pageKey];
          }

          for (const key of Object.keys(defaults) as Array<keyof T>) {
            const name = paramName(key);
            if (merged[key] === defaults[key]) {
              next.delete(name);
            } else {
              next.set(name, encode(merged[key]));
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaults, paramName, pageKey],
  );

  /** Clear only this table's params, leaving anything else in the URL alone. */
  const reset = useCallback(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const key of Object.keys(defaults) as Array<keyof T>) {
          next.delete(paramName(key));
        }
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams, defaults, paramName]);

  /** True when anything is filtered — drives a "Clear filters" affordance. */
  const isDirty = useMemo(
    () =>
      (Object.keys(defaults) as Array<keyof T>).some(
        (key) => key !== pageKey && state[key] !== defaults[key],
      ),
    [state, defaults, pageKey],
  );

  return { state, set, reset, isDirty };
}
