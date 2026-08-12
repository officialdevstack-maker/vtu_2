const normalizePlanType = (value: string | null | undefined): string =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "");

/**
 * Export normalizePlanType for internal use in type filtering logic.
 * Do NOT create unrestricted types that bypass network type checks.
 * All customer-facing plan types must be managed through the admin panel.
 */
export { normalizePlanType };

