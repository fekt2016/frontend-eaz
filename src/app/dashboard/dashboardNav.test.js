import { describe, it, expect } from "vitest";
import { marketplaceNav } from "./dashboardNav";

// T24: Marketplace and Inventory used to be two separate sidebar entries
// pointing at two now-merged pages.
describe("marketplaceNav (T24)", () => {
  it("has exactly one entry, pointing at the merged /dashboard/commerce page", () => {
    expect(marketplaceNav).toHaveLength(1);
    expect(marketplaceNav[0].href).toBe("/dashboard/commerce");
  });
});
