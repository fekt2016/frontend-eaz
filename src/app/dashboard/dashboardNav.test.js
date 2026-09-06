import { describe, it, expect } from "vitest";
import { baseNav, adminNav, marketplaceNav, posNav, titleForPath } from "./dashboardNav";

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

// The pre-order release queue had its own entry (T45). It is now a view of the
// staff order list: the same order rows plus one button, and as a second
// implementation of "list orders" it had drifted — no search, no pagination,
// against an endpoint capped at 10. Being hard to forget was the one thing the
// entry gave, and a count badge on Orders does that better: a nav item looks
// identical whether nobody or twelve people are waiting.
describe("marketplaceNav — pre-orders folded into the order list", () => {
  it("no longer has a dedicated pre-orders entry", () => {
    expect(marketplaceNav.map((n) => n.href)).not.toContain("/dashboard/commerce/preorders");
    expect(marketplaceNav.filter((n) => /pre-?order/i.test(n.label))).toHaveLength(0);
  });

  it("keeps the staff order list, which is where releasing now happens", () => {
    const entry = posNav.find((n) => n.href === "/dashboard/pos/orders");
    expect(entry).toBeDefined();
    expect(entry.roles).toEqual(expect.arrayContaining(["superadmin", "admin", "staff"]));
  });
});

// The Jobs sidenav entry was removed on request. The /dashboard/pos/jobs route itself
// still exists and is still reached from the dashboard "View all", the job-detail back
// link, and the staff redirect in /dashboard/repairs — only the sidebar link is gone.
describe("posNav — Jobs entry removed", () => {
  it("has no sidenav link to the jobs list", () => {
    expect(posNav.some((n) => n.href === "/dashboard/pos/jobs")).toBe(false);
  });

  it("has no sidenav link to /dashboard/pos (My Jobs), the technician's landing page", () => {
    expect(posNav.some((n) => n.href === "/dashboard/pos")).toBe(false);
  });

  it("leaves technicians with no Repair Shop POS sidenav section (repairs live under My Repairs)", () => {
    const forTech = posNav.filter((n) => !n.roles || n.roles.includes("technician"));
    expect(forTech).toHaveLength(0);
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

// Owner decision: admin/staff fulfil online shop orders from the POS "Orders"
// page (/dashboard/pos/orders), which lists the same shop orders. Keeping the
// base "Shop Orders" link as well would show the same list twice in the sidebar,
// so it is hidden for every role that has access to the POS Orders page.
// Technicians (no POS Orders entry) and customers keep it.
describe("baseNav — Shop Orders is staff-only-via-POS", () => {
  const visibleTo = (role) =>
    baseNav.filter((n) => !n.hideRoles || !n.hideRoles.includes(role)).map((n) => n.href);

  it.each(["superadmin", "admin", "staff", "technician"])(
    "hides /dashboard/orders from %s (staff use POS Orders; technicians do repairs only)",
    (role) => {
      expect(visibleTo(role)).not.toContain("/dashboard/orders");
    },
  );

  it("keeps /dashboard/orders for a customer", () => {
    expect(visibleTo("user")).toContain("/dashboard/orders");
  });

  it("still exposes My Repairs to technicians", () => {
    expect(visibleTo("technician")).toContain("/dashboard/repairs");
  });

  it("leaves the POS Orders entry for the roles that fulfil orders", () => {
    const entry = posNav.find((n) => n.href === "/dashboard/pos/orders");
    expect(entry).toBeDefined();
    expect(entry.roles).toEqual(expect.arrayContaining(["superadmin", "admin", "staff"]));
  });
});

// Owner request (2026-08-30): Settings gets a sidebar entry. It previously had
// a page and a title but deliberately no nav link, so it was only reachable by
// typing the URL.
describe("baseNav — Settings link", () => {
  const visibleTo = (role) =>
    baseNav.filter((n) => !n.hideRoles || !n.hideRoles.includes(role)).map((n) => n.href);

  it.each(["user", "staff", "technician", "admin", "superadmin"])(
    "is visible to %s — personal account settings belong to every role",
    (role) => {
      expect(visibleTo(role)).toContain("/dashboard/settings");
    },
  );

  it("resolves its page title from the nav entry", () => {
    expect(titleForPath("/dashboard/settings")).toBe("Settings");
  });

  // The entry must not also sit in extraTitles, which is documented as "routes
  // that have a title but deliberately no sidebar entry" — two sources for one
  // route is how a label and a link drift apart.
  it("is not duplicated as an extraTitle", () => {
    const settingsEntries = baseNav.filter((n) => n.href === "/dashboard/settings");
    expect(settingsEntries).toHaveLength(1);
  });

  it("does not disturb the admin-only Business Settings entry", () => {
    expect(adminNav.map((n) => n.href)).toContain("/dashboard/business-settings");
    expect(visibleTo("user")).not.toContain("/dashboard/business-settings");
  });
});
