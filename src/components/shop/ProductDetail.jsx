"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Play, Plus, Search } from "lucide-react";
import { formatGhs, stockBadge, placeholderToPng } from "@/lib/shop";
import { useCart } from "@/context/CartContext";
import { useProductBySlug } from "@/hooks/queries/useProducts";
import ProductReviews from "./ProductReviews";

const FALLBACK_IMAGE = "https://placehold.co/800x600/1e1b4b/ffffff?text=Product";

export default function ProductDetail({ slug }) {
  const { data: product, isLoading: loading, error: queryError } = useProductBySlug(slug);
  const error = queryError ? (queryError.message || "Product not found") : null;
  const [activeIndex, setActiveIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedSku, setSelectedSku] = useState(null);
  const { addItem, openCart } = useCart();

  useEffect(() => {
    setActiveIndex(0);
    setQty(1);
    setSelectedSku(null);
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-ink px-4 pt-32 pb-24">
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
<div className="min-h-screen bg-white dark:bg-ink px-4 pt-32 pb-24 flex items-start justify-center">
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-900 px-6 py-16 text-center max-w-md w-full">
          <p className="text-3xl mb-3"><Search size={30} className="inline text-gray-400 dark:text-slate-500" /></p>
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

const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const selectedVariant = hasVariants
    ? product.variants.find((v) => v.sku === selectedSku) || null
    : null;

  // Gallery media: variant images win when a variant with its own images is
  // selected, then product gallery, then the existing hero images (unchanged
  // fallback — products without gallery data look exactly like before).
  // Image sources pass through placeholderToPng so placehold.co SVGs load via next/image.
  const heroImages = product.images?.length ? product.images : [FALLBACK_IMAGE];
  const galleryImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : product.gallery?.images?.length
      ? product.gallery.images
      : heroImages;
  const galleryVideos = product.gallery?.videos || [];
  const media = [
    ...galleryImages.map((src) => ({ type: "image", src: placeholderToPng(src) })),
    ...galleryVideos.map((src) => ({ type: "video", src })),
  ];
  const activeMedia = media[Math.min(activeIndex, media.length - 1)] || media[0];

  const displayStock = selectedVariant ? Number(selectedVariant.stock) || 0 : product.stock;
  const badge = stockBadge(displayStock);
  const maxQty = Math.min(displayStock, 10);
  const inStock = displayStock > 0;

  const selectVariant = (variant) => {
    setSelectedSku(variant.sku);
    setActiveIndex(0);
  };

  const handleAddToCart = () => {
    if (!product || (hasVariants && !selectedVariant)) return;
    addItem(product, qty, selectedVariant || undefined);
    openCart();
  };

  const variantLabel = (v) => Object.values(v.attributes || {}).join(" ");

  return (
    <div className="min-h-screen bg-white dark:bg-ink text-gray-900 dark:text-slate-100 px-4 pt-28 pb-24">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition mb-8"
        >
          <ArrowLeft size={10} /> Back to shop
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* IMAGE/VIDEO GALLERY */}
          <div>
            <div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 aspect-[4/3]">
              {activeMedia?.type === "video" ? (
                <video
                  key={activeMedia.src}
                  src={activeMedia.src}
                  controls
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={activeMedia?.src || FALLBACK_IMAGE}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
              {media.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((i) => (i - 1 + media.length) % media.length)}
                    aria-label="Previous media"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 dark:bg-slate-900/70 p-2 text-gray-700 dark:text-slate-200 shadow hover:bg-white dark:hover:bg-slate-800 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((i) => (i + 1) % media.length)}
                    aria-label="Next media"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 dark:bg-slate-900/70 p-2 text-gray-700 dark:text-slate-200 shadow hover:bg-white dark:hover:bg-slate-800 transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
            {media.length > 1 && (
              <div className="mt-3 flex gap-3">
                {media.map((m, i) => (
                  <button
                    key={m.src + i}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    aria-label={m.type === "video" ? `View video ${i + 1}` : `View image ${i + 1}`}
                    className={`relative overflow-hidden rounded-xl border-2 w-20 h-16 transition ${
                      activeIndex === i ? "border-brand-500" : "border-gray-100 hover:border-gray-300 dark:border-slate-800 dark:hover:border-slate-600"
                    }`}
                  >
                    {m.type === "video" ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                        <Play size={16} className="text-white" />
                      </span>
                    ) : (
                      <Image
                        src={m.src}
                        alt={`${product.name} ${i + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div>
            <span className="inline-flex rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em]">
              {product.category}
            </span>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white mt-3 mb-3 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-5">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.classes}`}>
                {badge.label}
              </span>
{(selectedVariant?.sku || product.sku) && (
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  SKU: {selectedVariant ? selectedVariant.sku : product.sku}
                </span>
              )}
            </div>

            <p className="font-mono font-bold text-3xl text-brand-500 mb-6">{formatGhs(product.price)}</p>

            <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-8">{product.description}</p>

            {hasVariants && (
              <div className="mb-8">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                  Options
                  {selectedVariant && (
                    <span className="text-brand-500"> — {variantLabel(selectedVariant)}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const selected = selectedSku === v.sku;
                    return (
                      <button
                        key={v.sku}
                        type="button"
                        onClick={() => selectVariant(v)}
                        aria-pressed={selected}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          selected
                            ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400"
                            : "border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500"
                        }`}
                      >
                        {variantLabel(v)}
                      </button>
                    );
                  })}
                </div>
                {selectedVariant && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                    {selectedVariant.stock} in stock
                  </p>
                )}
              </div>
            )}

            {product.specs?.length > 0 && (
              <div className="mb-8">
                <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-3">
                  Specifications
                </h2>
                <dl className="divide-y divide-gray-100 dark:divide-slate-800 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                  {product.specs.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-start justify-between gap-4 px-4 py-2.5 bg-white dark:bg-slate-900"
                    >
                      <dt className="text-xs font-semibold text-gray-500 dark:text-slate-400 pt-0.5">
                        {s.label}
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white text-right">
                        {s.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* QTY + ADD TO CART */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-900 p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">Quantity</p>
                  <div className="flex items-center gap-3 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-ink px-3 py-2">
                    <button
                      type="button"
                      disabled={qty <= 1}
                      onClick={() => setQty((v) => v - 1)}
                      className="text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white w-6 text-center">{qty}</span>
                    <button
                      type="button"
                      disabled={!inStock || qty >= maxQty}
                      onClick={() => setQty((v) => v + 1)}
                      className="text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!inStock || (hasVariants && !selectedVariant)}
                  onClick={handleAddToCart}
                  className={`rounded-full px-6 py-3 text-sm font-semibold transition ${
                    inStock && (!hasVariants || selectedVariant)
                      ? "bg-gray-900 text-white hover:bg-gray-700 dark:bg-brand-500 dark:text-gray-900 dark:hover:bg-brand-400"
                      : "bg-gray-900 text-white opacity-50 dark:bg-slate-700"
                  }`}
                >
                  {!inStock
                    ? "Out of Stock"
                    : hasVariants && !selectedVariant
                      ? "Select an option"
                      : "Add to Cart"}
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
                You&apos;ll choose a delivery zone at checkout — stock is confirmed at payment.
              </p>
            </div>
          </div>
        </div>

        <ProductReviews product={product} />
      </div>
    </div>
  );
}