"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { api } from "@/lib/api";

const CartContext = createContext(null);

const STORAGE_KEY = "eazworld-cart";

function loadLocal() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((i) => ({ ...i, lineId: i.lineId || i.slug }));
  } catch {
    return [];
  }
}

function saveLocal(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // quota / private-mode
  }
}

function clearLocal() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Strip Mongo-specific fields (_id, product ref, timestamps) so the shape
 * matches what localStorage / addItem produces. Keeps only the fields the
 * frontend cares about.
 */
function sanitizeItem(item) {
  return {
    lineId: item.lineId,
    _id: item._id || item.product,
    slug: item.slug,
    name: item.name,
    price: item.price,
    image: item.image || "",
    category: item.category || "",
    stock: item.stock || 0,
    qty: item.qty || 1,
    ...(item.variant && { variant: item.variant }),
  };
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const syncedRef = useRef(false);

  // ── Hydration: load from the right source once auth resolves ──
  useEffect(() => {
    if (authLoading) return; // wait for auth to settle

    if (user) {
      // Logged-in → fetch DB cart, merge any lingering localStorage items
      (async () => {
        try {
          const res = await api.get("/cart");
          const dbItems = (res.data?.items || []).map(sanitizeItem);
          const localItems = loadLocal();

          if (localItems.length > 0 && dbItems.length > 0) {
            // Merge: for each local item, if lineId not in DB, append it;
            // if it exists, keep the higher qty.
            const merged = [...dbItems];
            for (const li of localItems) {
              const idx = merged.findIndex((i) => i.lineId === li.lineId);
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], qty: Math.max(merged[idx].qty, li.qty) };
              } else {
                merged.push(li);
              }
            }
            setItems(merged);
            // Push merged cart back to DB & clear localStorage
            await api.put("/cart", { items: merged });
            clearLocal();
          } else if (dbItems.length > 0) {
            setItems(dbItems);
          } else if (localItems.length > 0) {
            // DB is empty but localStorage has items — push them up
            setItems(localItems);
            await api.put("/cart", { items: localItems });
            clearLocal();
          } else {
            setItems([]);
          }
        } catch {
          // API failed — fall back to localStorage
          setItems(loadLocal());
        } finally {
          setHydrated(true);
          syncedRef.current = true;
        }
      })();
    } else {
      // Guest → localStorage only
      setItems(loadLocal());
      setHydrated(true);
      syncedRef.current = true;
    }
  }, [user, authLoading]);

  // ── Persist whenever items change (after hydration) ──
  useEffect(() => {
    if (!hydrated || !syncedRef.current) return;

    if (user) {
      api.put("/cart", { items }).catch(() => {});
    } else {
      saveLocal(items);
    }
  }, [items, hydrated, user]);

  // ── Clear cart on logout: wipe both localStorage and in-memory state ──
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (prevUserRef.current && !user && hydrated) {
      clearLocal();
      setItems([]);
    }
    prevUserRef.current = user;
  }, [user, hydrated]);

  // ── Cart actions (unchanged interface) ──

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
          _id: product._id,
          product: product._id,
          slug: product.slug,
          ...(selected && {
            variant: { sku: selected.sku, attributes: selected.attributes || {} },
          }),
          name: product.name,
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
