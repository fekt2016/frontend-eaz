"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FaShoppingCart, FaTimes } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import { formatGhs } from "@/lib/shop";
import CartItems from "./CartItems";

export default function CartDrawer() {
  const { items, count, subtotal, isOpen, closeCart } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={closeCart}
          />
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            className="fixed right-0 top-0 bottom-0 z-[70] flex w-full max-w-md flex-col bg-white shadow-2xl"
            role="dialog"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <FaShoppingCart className="text-amber-500" size={16} />
                <h2 className="font-display font-bold text-lg text-gray-900">Your Cart</h2>
                {count > 0 && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">{count}</span>
                )}
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="text-gray-400 hover:text-gray-900 transition"
                aria-label="Close cart"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5">
              <CartItems />
            </div>

            {items.length > 0 && (
              <div className="border-t border-gray-100 px-5 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span className="font-display font-bold text-xl text-gray-900">{formatGhs(subtotal)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full rounded-full bg-gray-900 py-3 text-center text-sm font-semibold text-white hover:bg-gray-700 transition"
                >
                  Checkout
                </Link>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-2 w-full rounded-full border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:border-gray-400 transition"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
