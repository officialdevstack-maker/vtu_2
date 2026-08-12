type DescribedDataPlan = {
  validity?: string | null;
  provider_plan_name?: string | null;
  provider_plan_description?: string | null;
  provider_plan_parse_confident?: boolean;
};

export function dataPlanDetails(plan: DescribedDataPlan): string {
  const original = plan.provider_plan_name?.trim() ?? "";

  // Older/unknown parsers and explicitly unconfident parses must show the
  // provider's untouched text rather than dropping qualifiers.
  if (original && plan.provider_plan_parse_confident !== true) return original;

  const parts = [plan.validity?.trim(), plan.provider_plan_description?.trim()]
    .filter((part): part is string => Boolean(part));

  return parts.filter(
    (part, index) =>
      parts.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) === index,
  ).join(" • ");
}
