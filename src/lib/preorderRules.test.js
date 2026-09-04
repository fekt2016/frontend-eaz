import { describe, it, expect } from "vitest";
import { isPreorderable, isVariantPreorderable, canPreorder } from "./shop";

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
