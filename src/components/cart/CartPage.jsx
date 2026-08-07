"use client";

import Link from "next/link";
import { FaArrowLeft, FaShoppingCart } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import { formatGhs } from "@/lib/shop";
import CartItems from "@/components/cart/CartItems";

export default function CartPage() {
  const { items, count, subtotal } = useCart();

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 pt-28 pb-24">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
        >
          <FaArrowLeft size={10} /> Back to shop
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <FaShoppingCart className="text-amber-500" size={22} />
          <h1 className="font-display font-black text-3xl md:text-4xl text-gray-900">Your Cart</h1>
          {count > 0 && (
            <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">{count} items</span>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white px-5">
          <CartItems />
        </div>

        {items.length > 0 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-6 py-5 sm:flex-row">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">Subtotal</p>
              <p className="font-display font-bold text-3xl text-gray-900">{formatGhs(subtotal)}</p>
            </div>
            <Link
              href="/checkout"
              className="rounded-full bg-gray-900 px-8 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
