import { describe, it, expect } from "vitest";
import { baseNav, marketplaceNav, posNav } from "./dashboardNav";

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

// Owner decision (2026-08-30): the address book is a CUSTOMER surface. Admin,
// superadmin, staff and technician should not see "My Addresses" at all — a
// personal delivery address book has no meaning on a staff account.
//
// This only covers the sidebar. Hiding a link is not access control: the gates
// that hold are denyRoles on backend routes/addressRoutes.js and the
// customer-only path check in src/middleware.js.
describe("baseNav — My Addresses is customer-only", () => {
  const visibleTo = (role) =>
    baseNav.filter((n) => !n.hideRoles || !n.hideRoles.includes(role)).map((n) => n.href);

  it("shows the address book to a customer", () => {
    expect(visibleTo("user")).toContain("/dashboard/addresses");
  });

  it.each(["superadmin", "admin", "staff", "technician"])(
    "hides the address book from %s",
    (role) => {
      expect(visibleTo(role)).not.toContain("/dashboard/addresses");
    },
  );

  it("leaves the other customer entries alone for a customer", () => {
    const hrefs = visibleTo("user");
    expect(hrefs).toContain("/dashboard/orders");
    expect(hrefs).toContain("/dashboard/repairs");
  });
});
