import { describe, expect, it } from "vitest";
import { normalizePlanType } from "../utils/buyDataPlanTypes";

describe("buy-data plan type filtering", () => {
  it("normalizes managed plan types consistently", () => {
    expect(normalizePlanType("STANDARD")).toBe("standard");
    expect(normalizePlanType("Data Share")).toBe("datashare");
    expect(normalizePlanType("cooperate_gifting")).toBe("cooperategifting");
  });

  it("does not reinterpret provider-derived names as customer types", () => {
    expect(normalizePlanType("VTU.NG")).toBe("vtu.ng");
    expect(normalizePlanType("CheapDataHub")).toBe("cheapdatahub");
  });
});
