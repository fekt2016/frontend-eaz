import { describe, it, expect } from "vitest";
import { stockBadge, canPreorder, preorderAvailability } from "./shop";

// T45: an out-of-stock product marked for pre-order is orderable. The storefront
// must mirror the server's rule exactly — offering what checkout would refuse, or
// refusing what it would allow, are both bugs the customer sees.
describe("stockBadge with pre-order (T45)", () => {
  it("says Pre-order instead of Out of stock when enabled", () => {
    expect(stockBadge(0, true).label).toBe("Pre-order");
  });

  it("still says Out of stock when the product is not marked for it", () => {
    expect(stockBadge(0, false).label).toBe("Out of stock");
    expect(stockBadge(0).label).toBe("Out of stock"); // existing callers unchanged
  });

  it("leaves in-stock badges alone even when pre-order is enabled", () => {
    expect(stockBadge(4, true).label).toBe("Only 4 left");
    expect(stockBadge(40, true).label).toBe("In stock");
  });
});

describe("canPreorder (T45)", () => {
  const enabled = { stock: 0, preorder: { enabled: true } };

  it("is true only with no stock and the flag set", () => {
    expect(canPreorder(enabled)).toBe(true);
    expect(canPreorder({ stock: 0, preorder: { enabled: false } })).toBe(false);
    expect(canPreorder({ stock: 3, preorder: { enabled: true } })).toBe(false);
  });

  it("handles a product from an API that predates the field", () => {
    expect(canPreorder({ stock: 0 })).toBe(false);
    expect(canPreorder(undefined)).toBe(false);
  });

  it("uses the variant's stock when one is given", () => {
    // The shopper picked a sold-out variant of an otherwise stocked product.
    expect(canPreorder({ stock: 10, preorder: { enabled: true } }, 0)).toBe(true);
    expect(canPreorder({ stock: 0, preorder: { enabled: true } }, 5)).toBe(false);
  });
});

describe("preorderAvailability (T45)", () => {
  it("reads a date and a note together", () => {
    const copy = preorderAvailability({
      preorder: { availableFrom: "2026-10-01T00:00:00Z", note: "ships from abroad" },
    });
    expect(copy).toMatch(/Expected 1 October 2026/);
    expect(copy).toMatch(/ships from abroad/);
  });

  it("returns nothing when there is nothing honest to say", () => {
    expect(preorderAvailability({ preorder: {} })).toBe("");
    expect(preorderAvailability({})).toBe("");
    expect(preorderAvailability({ preorder: { availableFrom: "not-a-date" } })).toBe("");
  });
});
