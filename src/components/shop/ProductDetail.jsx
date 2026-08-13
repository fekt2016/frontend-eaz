"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaArrowLeft, FaMinus, FaPlus } from "react-icons/fa";
import { api } from "@/lib/api";
import { formatGhs, stockBadge } from "@/lib/shop";
import { useCart } from "@/context/CartContext";

export default function ProductDetail({ slug }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const { addItem, openCart } = useCart();

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, qty);
    openCart();
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/products/${slug}`);
      setProduct(res.data);
    } catch (err) {
      setError(err.message || "Product not found");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
    setActiveImage(0);
    setQty(1);
  }, [load]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 px-4 pt-32 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="animate-pulse aspect-[4/3] rounded-2xl bg-gray-100 dark:bg-slate-800" />
            <div className="space-y-3">
              <div className="h-3 w-1/4 bg-gray-100 dark:bg-slate-800 rounded-full" />
              <div className="h-6 w-3/4 bg-gray-100 dark:bg-slate-800 rounded-full" />
              <div className="h-10 w-1/3 bg-gray-100 dark:bg-slate-800 rounded-full" />
              <div className="h-4 w-full bg-gray-100 dark:bg-slate-800 rounded-full" />
              <div className="h-4 w-2/3 bg-gray-100 dark:bg-slate-800 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 px-4 pt-32 pb-24 flex items-start justify-center">
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 px-6 py-16 text-center max-w-md w-full">
          <p className="text-3xl mb-3">🔍</p>
          <p className="font-semibold text-gray-900 dark:text-white mb-2">Product not found</p>
          <p className="text-gray-400 dark:text-slate-500 text-sm mb-6">{error}</p>
          <Link
            href="/shop"
            className="rounded-full border border-gray-300 dark:border-slate-600 px-5 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-900 dark:hover:border-white hover:text-gray-900 dark:hover:text-white transition"
          >
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const badge = stockBadge(product.stock);
  const images = product.images?.length ? product.images : ["https://placehold.co/800x600/1e1b4b/ffffff?text=Product"];
  const maxQty = Math.min(product.stock, 10);
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 px-4 pt-28 pb-24">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition mb-8"
        >
          <FaArrowLeft size={10} /> Back to shop
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* IMAGE GALLERY */}
          <div>
<div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 aspect-[4/3]">
              <Image
                src={images[activeImage]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    type="button"
                    onClick={() => setActiveImage(i)}
aria-label={`View image ${i + 1}`}
                    className={`relative overflow-hidden rounded-xl border-2 w-20 h-16 transition ${
                      activeImage === i ? "border-brand-500" : "border-gray-100 hover:border-gray-300 dark:border-slate-800 dark:hover:border-slate-600"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div>
            <span className="inline-flex rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400 px-3 py-1 text-xs font-semibold">
              {product.category}
            </span>
            <h1 className="font-display font-black text-3xl md:text-4xl text-gray-900 dark:text-white mt-3 mb-3 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-5">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.classes}`}>
                {badge.label}
              </span>
              {product.sku && <span className="text-xs text-gray-400 dark:text-slate-500">SKU: {product.sku}</span>}
            </div>

            <p className="font-display font-bold text-3xl text-brand-500 mb-6">{formatGhs(product.price)}</p>

            <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-8">{product.description}</p>

            {/* QTY + ADD TO CART */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">Quantity</p>
                  <div className="flex items-center gap-3 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2">
                    <button
                      type="button"
                      disabled={qty <= 1}
                      onClick={() => setQty((v) => v - 1)}
                      className="text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <FaMinus size={11} />
                    </button>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white w-6 text-center">{qty}</span>
                    <button
                      type="button"
                      disabled={!inStock || qty >= maxQty}
                      onClick={() => setQty((v) => v + 1)}
                      className="text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <FaPlus size={11} />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!inStock}
                  onClick={handleAddToCart}
                  className={`rounded-full px-6 py-3 text-sm font-semibold transition ${
                    inStock
                      ? "bg-gray-900 text-white hover:bg-gray-700 dark:bg-brand-500 dark:text-gray-900 dark:hover:bg-brand-400"
                      : "bg-gray-900 text-white opacity-50 dark:bg-slate-700"
                  }`}
                >
                  {inStock ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
                You&apos;ll choose a delivery zone at checkout — stock is confirmed at payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
