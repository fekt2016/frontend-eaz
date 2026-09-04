import { describe, it, expect } from "vitest";
import { isPreorderable, isVariantPreorderable, canPreorder, resolvePreorder, cartLineCeiling } from "./shop";

// The storefront must not refuse what checkout would accept, nor offer what it
// would reject. These mirror resolveVariantPreorder in the order controller:
// a variant's explicit boolean wins, and UNSET falls through to the product.
const product = (preorder, variants = []) => ({ preorder, variants, stock: 0 });

describe("isVariantPreorderable", () => {
  it("uses the variant's own flag when it is set", () => {
    const p = product({ enabled: false });
    expect(isVariantPreorderable(p, { sku: "V1", preorder: { enabled: true } })).toBe(true);
  });

  it("falls through to the product when the variant is unset", () => {
    // The bug: this returned false, so a product-level pre-order reached no
    // variant and the page showed "Out of Stock" while checkout would accept it.
    const p = product({ enabled: true });
    expect(isVariantPreorderable(p, { sku: "V1", preorder: { enabled: null } })).toBe(true);
    expect(isVariantPreorderable(p, { sku: "V1" })).toBe(true);
  });

  it("lets a variant opt OUT even when the product is on", () => {
    const p = product({ enabled: true });
    expect(isVariantPreorderable(p, { sku: "V1", preorder: { enabled: false } })).toBe(false);
  });

  it("is false when neither says yes", () => {
    expect(isVariantPreorderable(product({ enabled: false }), { sku: "V1" })).toBe(false);
  });

  it("falls back to the product when no variant is chosen", () => {
    expect(isVariantPreorderable(product({ enabled: true }), null)).toBe(true);
  });
});

describe("isPreorderable", () => {
  it("is true when any single variant opts in, even with the product off", () => {
    // One sold-out colour can be pre-ordered while its siblings sell normally.
    const p = product({ enabled: false }, [
      { sku: "A", preorder: { enabled: true } },
      { sku: "B", preorder: { enabled: null } },
    ]);
    expect(isPreorderable(p)).toBe(true);
  });
});

describe("canPreorder", () => {
  it("only offers a pre-order once the stock is actually gone", () => {
    const p = product({ enabled: true });
    expect(canPreorder(p, 3)).toBe(false);
    expect(canPreorder(p, 0)).toBe(true);
  });
});

// The date, note and cap are per-level too. Showing the product's (usually
// empty) copy beside a variant that ships from abroad misleads the buyer, and
// enforcing the product's cap on a variant with a tighter one oversells it.
describe("resolvePreorder terms", () => {
  const p = product({ enabled: true, note: "product note", maxQty: 10, availableFrom: "2026-01-01" }, []);

  it("returns the variant's own terms when the variant opted in", () => {
    const terms = resolvePreorder(p, {
      sku: "V1",
      preorder: { enabled: true, note: "ships from abroad", maxQty: 2, availableFrom: "2026-03-01" },
    });
    expect(terms).toEqual({ availableFrom: "2026-03-01", note: "ships from abroad", maxQty: 2 });
  });

  it("falls through to the product's terms when the variant is unset", () => {
    const terms = resolvePreorder(p, { sku: "V1" });
    expect(terms).toEqual({ availableFrom: "2026-01-01", note: "product note", maxQty: 10 });
  });

  it("is null when the variant opted out", () => {
    expect(resolvePreorder(p, { sku: "V1", preorder: { enabled: false } })).toBeNull();
  });

  it("is null when neither level says yes", () => {
    expect(resolvePreorder(product({ enabled: false }), { sku: "V1" })).toBeNull();
  });
});

// A pre-order line holds no stock, so bounding its quantity by `stock` pinned it
// at one unit — the cart's + button sat disabled and updateQty floored it back.
describe("cartLineCeiling", () => {
  it("bounds an ordinary line by its stock", () => {
    expect(cartLineCeiling({ stock: 3 })).toBe(3);
  });

  it("bounds a pre-order line by its cap, not its zero stock", () => {
    expect(cartLineCeiling({ stock: 0, isPreorder: true, preorderMaxQty: 2 })).toBe(2);
  });

  it("gives an uncapped pre-order the same 10 the product page uses", () => {
    expect(cartLineCeiling({ stock: 0, isPreorder: true, preorderMaxQty: null })).toBe(10);
  });

  it("never lets a cap exceed 10", () => {
    expect(cartLineCeiling({ stock: 0, isPreorder: true, preorderMaxQty: 50 })).toBe(10);
  });
});
