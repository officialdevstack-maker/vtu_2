import { describe, expect, it } from "vitest";
import { dataPlanDetails } from "./dataPlanDisplay";

describe("dataPlanDetails", () => {
  it.each([
    [{ validity: "", provider_plan_name: "1.75GB - Sunday", provider_plan_description: "Sunday", provider_plan_parse_confident: true }, "Sunday"],
    [{ validity: "7 Days", provider_plan_name: "1GB + 5 mins - 7 Days", provider_plan_description: "Includes 5 mins", provider_plan_parse_confident: true }, "7 Days • Includes 5 mins"],
    [{ validity: "", provider_plan_name: "2.2GB - Weekend", provider_plan_description: "Weekend", provider_plan_parse_confident: true }, "Weekend"],
    [{ validity: "30 Days", provider_plan_name: "500MB Gift - 30 Days", provider_plan_description: "Gift", provider_plan_parse_confident: true }, "30 Days • Gift"],
  ])("formats provider qualifiers", (plan, expected) => {
    expect(dataPlanDetails(plan)).toBe(expected);
  });

  it("falls back to the untouched provider name when parsing is uncertain", () => {
    expect(dataPlanDetails({
      validity: "",
      provider_plan_name: "Night bundle with unusual allocation",
      provider_plan_description: "Night bundle with unusual allocation",
      provider_plan_parse_confident: false,
    })).toBe("Night bundle with unusual allocation");
  });
});
