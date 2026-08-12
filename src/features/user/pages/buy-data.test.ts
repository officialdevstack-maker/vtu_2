import { describe, expect, it } from "vitest";
import { isUnrestrictedPlanType } from "../utils/buyDataPlanTypes";

describe("buy-data plan type filtering", () => {
  it("keeps STANDARD plans compatible without a matching network type", () => {
    expect(isUnrestrictedPlanType("STANDARD")).toBe(true);
    expect(isUnrestrictedPlanType("standard")).toBe(true);
  });

  it("retains the existing VTU.ng synced-plan exception", () => {
    expect(isUnrestrictedPlanType("VTU.NG")).toBe(true);
    expect(isUnrestrictedPlanType("SME")).toBe(false);
  });
});
