import { describe, it, expect } from "vitest";
import { marketplaceNav, posNav } from "./dashboardNav";

// T24: Marketplace and Inventory used to be two separate sidebar entries
// pointing at two now-merged pages.
describe("marketplaceNav (T24)", () => {
  it("has a single Marketplace entry pointing at the merged page", () => {
    const marketplace = marketplaceNav.filter((n) => n.href === "/dashboard/commerce");
    expect(marketplace).toHaveLength(1);
  });

  it("has no separate Inventory entry — that page was merged away", () => {
    // What T24 actually protects. The section itself is free to grow (T45 added
    // Pre-orders); what must never come back is a second entry for the merged page.
    const hrefs = marketplaceNav.map((n) => n.href);
    expect(hrefs).not.toContain("/dashboard/commerce/inventory");
    expect(marketplaceNav.filter((n) => /inventory/i.test(n.label)).length).toBe(0);
  });
});

// T45: releasing pre-orders is a recurring job someone has to go looking for, so
// it gets its own entry rather than living inside one order's detail page.
describe("marketplaceNav — pre-orders (T45)", () => {
  it("links to the pre-order release queue", () => {
    const entry = marketplaceNav.find((n) => n.href === "/dashboard/commerce/preorders");
    expect(entry).toBeDefined();
    expect(entry.label).toBe("Pre-orders");
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
