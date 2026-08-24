import { describe, it, expect } from "vitest";
import { marketplaceNav, posNav } from "./dashboardNav";

// T24: Marketplace and Inventory used to be two separate sidebar entries
// pointing at two now-merged pages.
describe("marketplaceNav (T24)", () => {
  it("has exactly one entry, pointing at the merged /dashboard/commerce page", () => {
    expect(marketplaceNav).toHaveLength(1);
    expect(marketplaceNav[0].href).toBe("/dashboard/commerce");
  });
});

// The Jobs sidenav entry was removed on request. The /dashboard/pos/jobs route itself
// still exists and is still reached from the dashboard "View all", the job-detail back
// link, and the staff redirect in /dashboard/repairs — only the sidebar link is gone.
describe("posNav — Jobs entry removed", () => {
  it("has no sidenav link to the jobs list", () => {
    expect(posNav.some((n) => n.href === "/dashboard/pos/jobs")).toBe(false);
  });

  it("keeps My Jobs, which is the technician's only nav entry", () => {
    const myJobs = posNav.find((n) => n.href === "/dashboard/pos");
    expect(myJobs).toBeDefined();
    expect(myJobs.roles).toContain("technician");
  });

  it("leaves the rest of the POS nav intact", () => {
    const hrefs = posNav.map((n) => n.href);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/dashboard/pos/sell",
        "/dashboard/pos/orders",
        "/dashboard/pos/suppliers",
        "/dashboard/pos/expenses",
        "/dashboard/pos/warranty",
        "/dashboard/pos/reports",
      ]),
    );
  });
});
