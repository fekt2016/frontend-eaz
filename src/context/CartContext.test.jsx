import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "./CartContext";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));
vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

// Prices are integer pesewas — the cart never converts, so subtotal stays in pesewas.
const product = (over = {}) => ({
  slug: "cable", name: "Cable", price: 2000, images: [], stock: 10, ...over,
});

describe("CartContext math", () => {
  beforeEach(() => window.localStorage.clear());

  it("adds items and sums subtotal in pesewas", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem(product(), 2));
    expect(result.current.count).toBe(2);
    expect(result.current.subtotal).toBe(4000); // 2000 × 2

    act(() => result.current.addItem(product({ slug: "case", price: 1500 }), 1));
    expect(result.current.count).toBe(3);
    expect(result.current.subtotal).toBe(5500); // 4000 + 1500
  });

  it("merges quantity when the same slug is added again", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product(), 1));
    act(() => result.current.addItem(product(), 2));
    expect(result.current.count).toBe(3);
    expect(result.current.subtotal).toBe(6000);
  });

  it("updates quantity and removes items", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product(), 1));

    act(() => result.current.updateQty("cable", 4));
    expect(result.current.subtotal).toBe(8000);

    act(() => result.current.removeItem("cable"));
    expect(result.current.count).toBe(0);
    expect(result.current.subtotal).toBe(0);
  });

  it("clears the cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product(), 3));
    act(() => result.current.clearCart());
    expect(result.current.count).toBe(0);
  });
});

describe("CartContext variants", () => {
  beforeEach(() => window.localStorage.clear());

  const variantProduct = () => ({
    slug: "case",
    name: "Case",
    price: 15999,
    images: [],
    stock: 150,
    variants: [
      { sku: "BLK", attributes: { color: "Black" }, stock: 10 },
      { sku: "BLU", attributes: { color: "Blue" }, stock: 5 },
    ],
  });

  it("keeps two different variants of the same product as separate lines", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(variantProduct(), 1, { sku: "BLK", attributes: { color: "Black" } }));
    act(() => result.current.addItem(variantProduct(), 1, { sku: "BLU", attributes: { color: "Blue" } }));

    expect(result.current.items).toHaveLength(2);
    expect(result.current.count).toBe(2);
    // Distinct line identity — slug + variant SKU.
    expect(result.current.items[0].lineId).toBe("case::BLK");
    expect(result.current.items[1].lineId).toBe("case::BLU");
    expect(result.current.subtotal).toBe(15999 * 2);
  });

  it("merges the same variant and clamps qty to that variant's stock", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    // Blue has only 5 in stock — 3 + 3 must clamp to 5, not merge into 6.
    act(() => result.current.addItem(variantProduct(), 3, { sku: "BLU", attributes: { color: "Blue" } }));
    act(() => result.current.addItem(variantProduct(), 3, { sku: "BLU", attributes: { color: "Blue" } }));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].qty).toBe(5);
    expect(result.current.items[0].stock).toBe(5);
    expect(result.current.count).toBe(5);
  });

  it("clamps an over-stock first add to the variant stock", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(variantProduct(), 99, { sku: "BLK", attributes: { color: "Black" } }));

    expect(result.current.items[0].qty).toBe(10); // variant stock, not top-level 150
    expect(result.current.items[0].variant.sku).toBe("BLK");
    expect(result.current.items[0].variant.attributes).toEqual({ color: "Black" });
  });

  it("uses the variant's own price when set, not the base product price", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const vp = variantProduct();
    vp.variants[0].price = 17999;
    act(() => result.current.addItem(vp, 1, { sku: "BLK", attributes: { color: "Black" } }));

    expect(result.current.items[0].price).toBe(17999);
  });

  it("falls back to the base product price when the variant price is unset", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(variantProduct(), 1, { sku: "BLK", attributes: { color: "Black" } }));

    expect(result.current.items[0].price).toBe(15999);
  });

  it("respects an explicit 0 variant price as free, not as unset", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const vp = variantProduct();
    vp.variants[0].price = 0;
    act(() => result.current.addItem(vp, 1, { sku: "BLK", attributes: { color: "Black" } }));

    expect(result.current.items[0].price).toBe(0);
  });

  it("stores variant image for the line thumbnail when present", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const vp = variantProduct();
    vp.variants[0].images = ["https://res.cloudinary.com/demo/black.jpg"];
    act(() => result.current.addItem(vp, 1, { sku: "BLK", attributes: { color: "Black" } }));

    expect(result.current.items[0].image).toBe("https://res.cloudinary.com/demo/black.jpg");
  });

  it("non-variant products keep the old slug-only identity and merge", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(product(), 1));
    act(() => result.current.addItem(product(), 2));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].lineId).toBe("cable");
    expect(result.current.items[0].variant).toBeUndefined();
    expect(result.current.count).toBe(3);
  });

  it("updateQty clamps to the stored variant stock snapshot", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(variantProduct(), 2, { sku: "BLU", attributes: { color: "Blue" } }));
    act(() => result.current.updateQty("case::BLU", 99));

    expect(result.current.items[0].qty).toBe(5); // clamped to Blue's stock of 5
  });
});
