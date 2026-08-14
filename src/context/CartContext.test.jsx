import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "./CartContext";

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
