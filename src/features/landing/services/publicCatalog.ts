import { apiClient } from "@/shared/api/apiClient";

export const PUBLIC_DATA_CATALOG_ENDPOINT = "/public/catalog/data-plans";

export const CUSTOMER_PLAN_TYPES = [
  "STANDARD",
  "SME",
  "GIFTING",
  "CG",
  "DATA SHARE",
  "AWOOF",
] as const;

export type PublicDataPlan = {
  network: string;
  plan_name: string;
  amount: string;
  unit: string;
  validity: string;
  plan_type: (typeof CUSTOMER_PLAN_TYPES)[number];
  selling_price: number;
};

type ApiEnvelope = { data?: unknown };

const allowedTypes = new Set<string>(CUSTOMER_PLAN_TYPES);
const allowedNetworks = new Set(["mtn", "airtel", "glo", "9mobile"]);

const cleanText = (value: unknown, maxLength = 80): string =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const normalizePlanType = (value: unknown): string =>
  cleanText(value, 30).toUpperCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");

// This parser is intentionally a whitelist. Even if the API accidentally adds
// provider, cost or routing fields later, they can never enter the public UI.
export function parsePublicDataPlans(payload: unknown): PublicDataPlan[] {
  const body = payload as ApiEnvelope | null;
  const rows = Array.isArray(body?.data) ? body.data : Array.isArray(payload) ? payload : [];

  return rows.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const row = raw as Record<string, unknown>;
    const network = cleanText(row.network, 20).toLowerCase();
    const planType = normalizePlanType(row.plan_type);
    const sellingPrice = Number(row.selling_price);

    if (
      row.active === false ||
      row.purchasable === false ||
      row.network_active === false ||
      !allowedNetworks.has(network) ||
      !allowedTypes.has(planType) ||
      !Number.isFinite(sellingPrice) ||
      sellingPrice <= 0
    ) {
      return [];
    }

    const planName = cleanText(row.plan_name);
    if (!planName) return [];

    return [{
      network,
      plan_name: planName,
      amount: cleanText(row.amount, 20),
      unit: cleanText(row.unit, 10).toUpperCase(),
      validity: cleanText(row.validity, 40) || "—",
      plan_type: planType as PublicDataPlan["plan_type"],
      selling_price: sellingPrice,
    }];
  });
}

export async function getPublicDataPlans(): Promise<PublicDataPlan[]> {
  const response = await apiClient.get<ApiEnvelope>(PUBLIC_DATA_CATALOG_ENDPOINT);
  return parsePublicDataPlans(response.data);
}
