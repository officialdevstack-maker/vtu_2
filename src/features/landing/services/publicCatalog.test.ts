import { describe, expect, it } from "vitest";
import { parsePublicDataPlans } from "./publicCatalog";

describe("public data catalogue boundary", () => {
  it("returns only active, purchasable plans with customer-facing types", () => {
    const plans = parsePublicDataPlans({ data: [
      { network: "MTN", plan_name: "1GB Monthly", amount: "1", unit: "gb", validity: "30 Days", plan_type: "standard", selling_price: "600", active: true, purchasable: true },
      { network: "MTN", plan_name: "Disabled", plan_type: "SME", selling_price: 500, active: false },
      { network: "Glo", plan_name: "Supplier row", plan_type: "VTU.ng", selling_price: 400, active: true },
    ] });

    expect(plans).toEqual([{ network: "mtn", plan_name: "1GB Monthly", amount: "1", unit: "GB", validity: "30 Days", plan_type: "STANDARD", selling_price: 600 }]);
  });

  it("does not carry supplier, external ID, cost or database fields into the UI", () => {
    const [plan] = parsePublicDataPlans({ data: [{ network: "Airtel", plan_name: "2GB", plan_type: "GIFTING", validity: "30 Days", selling_price: 1200, provider: "CheapDataHub", external_plan_id: "secret", cost_price: 800, id: 99, active: true }] });
    expect(Object.keys(plan)).toEqual(["network", "plan_name", "amount", "unit", "validity", "plan_type", "selling_price"]);
    expect(JSON.stringify(plan)).not.toMatch(/CheapDataHub|external_plan_id|cost_price/);
  });

  it("handles empty and malformed payloads", () => {
    expect(parsePublicDataPlans({ data: [] })).toEqual([]);
    expect(parsePublicDataPlans({ data: null })).toEqual([]);
  });
});
