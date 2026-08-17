"use client";

import Link from "next/link";
import { FaArrowLeft, FaShoppingCart } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import { formatGhs } from "@/lib/shop";
import CartItems from "@/components/cart/CartItems";

export default function CartPage() {
  const { items, count, subtotal } = useCart();

  return (
    <div className="min-h-screen bg-white dark:bg-ink text-gray-900 dark:text-slate-100 px-4 pt-28 pb-24">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <FaArrowLeft size={10} /> Back to shop
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <FaShoppingCart className="text-brand-500" size={22} />
          <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white">Your Cart</h1>
          {count > 0 && (
            <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-bold text-white">{count} items</span>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5">
          <CartItems />
        </div>

        {items.length > 0 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-900 px-6 py-5 sm:flex-row">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">Subtotal</p>
              <p className="font-display font-bold text-3xl text-gray-900 dark:text-white">{formatGhs(subtotal)}</p>
            </div>
            <Link
              href="/checkout"
              className="rounded-full bg-gray-900 dark:bg-brand-500 px-8 py-3 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
