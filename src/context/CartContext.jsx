"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "eazworld-cart";

function loadCart() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Legacy carts (pre-variants) have no lineId — fall back to the slug so
    // the old slug-only identity keeps working.
    return parsed.map((i) => ({ ...i, lineId: i.lineId || i.slug }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota / private-mode errors
    }
  }, [items, hydrated]);

  // Line-item identity = slug + variant SKU when a variant is selected, slug
  // alone otherwise. Without the SKU dimension, two different variants of the
  // same product would merge into one line — the bug this change fixes.
  // Non-variant products keep today's exact slug-only behaviour.
  const addItem = useCallback((product, qty = 1, variant) => {
    setItems((prev) => {
      const selected = product.variants?.find((v) => v.sku === variant?.sku);
      const stock = selected ? Number(selected.stock) || 0 : Number(product.stock) || 0;
      if (stock <= 0) return prev;
      const addQty = Math.min(Math.max(Math.floor(qty) || 1, 1), stock);
      const lineId = selected ? `${product.slug}::${selected.sku}` : product.slug;
      const existing = prev.find((i) => i.lineId === lineId);
      if (existing) {
        const nextQty = Math.min(existing.qty + addQty, stock);
        return prev.map((i) => (i.lineId === lineId ? { ...i, qty: nextQty } : i));
      }
      return [
        ...prev,
        {
          lineId,
          slug: product.slug,
          ...(selected && {
            variant: { sku: selected.sku, attributes: selected.attributes || {} },
          }),
          name: product.name,
          // Variant price wins when set; unset falls back to base price —
          // matches the server-side resolution in orderController.createOrder.
          price: selected?.price != null ? selected.price : product.price,
          image: selected?.images?.[0] || product.images?.[0] || "",
          category: product.category,
          stock,
          qty: addQty,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((lineId) => {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));
  }, []);

  const updateQty = useCallback((lineId, qty) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.lineId !== lineId) return i;
        const nextQty = Math.max(1, Math.min(Math.floor(qty) || 1, i.stock));
        return { ...i, qty: nextQty };
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, isOpen, addItem, removeItem, updateQty, clearCart, openCart, closeCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
