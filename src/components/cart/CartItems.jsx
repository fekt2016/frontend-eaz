"use client";

import Link from "next/link";
import Image from "next/image";
import { FaMinus, FaPlus, FaTimes } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import { formatGhs, placeholderToPng } from "@/lib/shop";

export default function CartItems() {
  const { items, removeItem, updateQty } = useCart();

  const href = (slug) => (slug?.startsWith("part-") ? null : `/shop/${slug}`);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-3xl mb-3">🛒</p>
        <p className="font-semibold text-gray-900 dark:text-white mb-1">Your cart is empty</p>
        <p className="text-gray-400 dark:text-slate-500 text-sm mb-6 max-w-xs">
          Browse the shop and add a product to get started.
        </p>
        <Link
          href="/shop"
          className="rounded-full bg-gray-900 dark:bg-brand-500 px-5 py-2 text-xs font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition"
        >
          Browse the Shop
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-slate-800">
      {items.map((item) => {
        const itemHref = href(item.slug);
        const thumb = itemHref ? (
          <Link
            href={itemHref}
            className="block h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800"
          >
            <Image
              src={placeholderToPng(item.image || "https://placehold.co/200x200/1e1b4b/ffffff.png?text=Product")}
              alt={item.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </Link>
        ) : (
          <div className="block h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800">
            <Image
              src={placeholderToPng(item.image || "https://placehold.co/200x200/1e1b4b/ffffff.png?text=Part")}
              alt={item.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        );
        return (
        <li key={item.slug} className="flex gap-4 py-4">
          {thumb}
          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{item.category}</p>
                {itemHref ? (
                <Link
                  href={itemHref}
                  className="text-sm font-semibold text-gray-900 dark:text-white hover:text-brand-500 transition line-clamp-1"
                >
                  {item.name}
                </Link>
                ) : (
                <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.slug)}
                className="text-gray-300 dark:text-slate-600 hover:text-gray-700 dark:hover:text-white transition"
                aria-label={`Remove ${item.name}`}
              >
                <FaTimes size={13} />
              </button>
            </div>
            <div className="mt-auto flex items-center justify-between pt-2">
              <div className="flex items-center gap-3 rounded-full border border-gray-200 dark:border-slate-700 px-2.5 py-1">
                <button
                  type="button"
                  disabled={item.qty <= 1}
                  onClick={() => updateQty(item.slug, item.qty - 1)}
                  className="text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  <FaMinus size={9} />
                </button>
                <span className="w-5 text-center text-xs font-semibold text-gray-900 dark:text-white">{item.qty}</span>
                <button
                  type="button"
                  disabled={item.qty >= item.stock}
                  onClick={() => updateQty(item.slug, item.qty + 1)}
                  className="text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  <FaPlus size={9} />
                </button>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{formatGhs(item.price * item.qty)}</p>
            </div>
          </div>
        </li>
        );
      })}
    </ul>
  );
}
