const normalizePlanType = (value: string | null | undefined): string =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "");

/** Types that remain sellable without a matching per-network type toggle. */
export const isUnrestrictedPlanType = (
  value: string | null | undefined,
): boolean => ["standard", "vtu.ng"].includes(normalizePlanType(value));
