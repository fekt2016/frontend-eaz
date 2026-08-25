"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Minus, Package, Play, Plus, Search, ShoppingBag } from "lucide-react";
import { formatCount, formatGhs, stockBadge, placeholderToPng, canPreorder, preorderAvailability } from "@/lib/shop";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useProductBySlug } from "@/hooks/queries/useProducts";
import { useProductReviews } from "@/hooks/queries/useProductReviews";
import ProductReviews from "./ProductReviews";
import ProductImage, { PRODUCT_PLACEHOLDER } from "./ProductImage";

const FALLBACK_IMAGE = PRODUCT_PLACEHOLDER;

const TABS = { DESCRIPTION: "Description", SPECS: "Specs", REVIEWS: "Reviews" };

const SHORT_DESCRIPTION_MAX = 180;

// Fallback only. The buy column prefers the editor-authored `product.shortDescription`
// (T39); this derives a stand-in for products created before that field existed, so
// their buy column isn't left bare. Prefer the opening sentence, and fall back to a
// word-boundary trim when that sentence is itself long.
export function summarizeDescription(text, max = SHORT_DESCRIPTION_MAX) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;

  const firstSentence = clean.match(/^.*?[.!?](?=\s|$)/)?.[0];
  if (firstSentence && firstSentence.length <= max) return firstSentence;

  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, "")}…`;
}

export default function ProductDetail({ slug }) {
  const { data: product, isLoading: loading, error: queryError } = useProductBySlug(slug);
  const error = queryError ? (queryError.message || "Product not found") : null;
  const [activeIndex, setActiveIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedSku, setSelectedSku] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.DESCRIPTION);
  const tabPanelRef = useRef(null);
  const { addItem, openCart } = useCart();

  // T48: a view is a person opening this page, so it is recorded from the
  // browser after the product renders — never from the fetch itself. The detail
  // GET runs three times per visit (generateMetadata, the server render, then
  // this component) and Next prefetches the route on link hover, so counting
  // there tallied fetches, not visitors. A POST from here also means crawlers,
  // which never run this script, cannot inflate the figure.
  const [recordedViews, setRecordedViews] = useState(null);
  const countedSlug = useRef(null);

  useEffect(() => {
    // Retail parts (`part-<id>` slugs) carry no view counter.
    if (!product?._id || slug?.startsWith("part-")) return;
    // Ref rather than state: React's development double-mount would otherwise
    // count every page open twice.
    if (countedSlug.current === slug) return;
    countedSlug.current = slug;

    let live = true;
    api
      .post(`/products/${encodeURIComponent(slug)}/view`)
      .then((res) => {
        if (live && res?.data?.views != null) setRecordedViews(res.data.views);
      })
      .catch(() => {}); // a missed count must never break the page

    // The count is already recorded server-side; this only stops a late response
    // setting state on a page the visitor has already left.
    return () => {
      live = false;
    };
  }, [slug, product?._id]);

  // Same query key as ProductReviews' own call, so react-query serves both from one
  // cache entry — this is for the "Reviews (n)" count, not a second network request.
  const { data: reviewsData } = useProductReviews(product?._id);
  const reviewCount = reviewsData?.total ?? 0;

  useEffect(() => {
    setActiveIndex(0);
    setQty(1);
    setSelectedSku(null);
    setActiveTab(TABS.DESCRIPTION);
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
          <p className="text-3xl mb-3"><Search size={30} className="inline text-gray-600 dark:text-slate-500" /></p>
          <p className="font-semibold text-gray-900 dark:text-white mb-2">Product not found</p>
          <p className="text-gray-600 dark:text-slate-500 text-sm mb-6">{error}</p>
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

  // The count the server returned when it recorded this visit, so the page shows
  // a figure that includes the person reading it rather than a stale one.
  const viewCount = recordedViews ?? product.views;
  const displayStock = selectedVariant ? Number(selectedVariant.stock) || 0 : product.stock;
  // T45: with no stock on hand, a product marked for pre-order is still orderable.
  // `preorderable` is the only thing standing between "Out of Stock" and a sale.
  const preorderable = canPreorder(product, displayStock);
  const badge = stockBadge(displayStock, product.preorder?.enabled);
  const inStock = displayStock > 0;
  // A pre-order draws on no stock, so the quantity ceiling is the product's own
  // cap instead — the server enforces the same number at checkout.
  const maxQty = preorderable
    ? Math.min(product.preorder?.maxQty || 10, 10)
    : Math.min(displayStock, 10);
  const orderable = inStock || preorderable;
  const availabilityCopy = preorderAvailability(product);

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

  // Variant price wins when set; unset (null/undefined) falls back to the
  // base product price — not the same as an explicit 0 (free) variant.
  const displayPrice = selectedVariant?.price != null ? selectedVariant.price : product.price;

  // Specs only earns a tab when the product actually has any (T39).
  const hasSpecs = product.specs?.length > 0;
  const fullDescription = (product.description || "").replace(/\s+/g, " ").trim();
  // Editor-authored summary wins; derive one only when the product predates the field.
  const shortDescription =
    (product.shortDescription || "").trim() || summarizeDescription(product.description);
  // Only offer "Read more" when the tab actually holds something the summary didn't.
  const isSummarized = Boolean(fullDescription) && shortDescription !== fullDescription;
  const tabs = [TABS.DESCRIPTION, ...(hasSpecs ? [TABS.SPECS] : []), TABS.REVIEWS];
  const slugifyTab = (tab) => tab.toLowerCase();
  const tabId = (tab) => `product-tab-${slugifyTab(tab)}`;
  const panelId = (tab) => `product-panel-${slugifyTab(tab)}`;

  const selectTab = (tab) => {
    setActiveTab(tab);
    // Bring the panel into view on switch, so a tall Reviews list doesn't leave the
    // reader stranded mid-page. scroll-mt on the panel keeps it clear of the header.
    requestAnimationFrame(() => {
      tabPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

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
                <ProductImage
                  src={activeMedia?.src}
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
                      <ProductImage
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
            <span className="inline-flex rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400 px-3 py-1 font-mono text-eyebrow font-bold uppercase">
              {product.category}
            </span>
            <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white mt-3 mb-3 leading-tight">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-5">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.classes}`}>
                {badge.label}
              </span>
{(selectedVariant?.sku || product.sku) && (
                <span className="text-xs text-gray-600 dark:text-slate-500">
                  SKU: {selectedVariant ? selectedVariant.sku : product.sku}
                </span>
              )}
              {/* T48: the badge rounds off ("In stock" above 10), so spell the
                  numbers out here. Stock follows the selected variant; views and
                  units sold are product-wide. */}
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                <Package className="h-3.5 w-3.5" aria-hidden="true" />
                {inStock
                  ? `In stock: ${displayStock}`
                  : preorderable
                    ? "Available to pre-order"
                    : "Out of stock"}
              </span>
              {product.sold != null && (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatCount(product.sold)} sold
                </span>
              )}
              {viewCount != null && (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatCount(viewCount)} {Number(viewCount) === 1 ? "view" : "views"}
                </span>
              )}
            </div>

            {shortDescription && (
              <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-5 max-w-prose">
                {shortDescription}
                {isSummarized && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => selectTab(TABS.DESCRIPTION)}
                      className="font-semibold text-brand-500 hover:text-brand-400 underline underline-offset-2"
                    >
                      Read more
                    </button>
                  </>
                )}
              </p>
            )}

            {/* T35: variant price when set, base price otherwise. */}
            <p className="font-mono font-bold text-3xl text-brand-500 mb-6">{formatGhs(displayPrice)}</p>

            {/* Full description and specs live in the tabs below the grid (T39). */}

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
                  <p className="text-xs text-gray-600 dark:text-slate-500 mt-2">
                    {selectedVariant.stock} in stock
                  </p>
                )}
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
                      className="text-gray-600 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white w-6 text-center">{qty}</span>
                    <button
                      type="button"
                      disabled={!orderable || qty >= maxQty}
                      onClick={() => setQty((v) => v + 1)}
                      className="text-gray-600 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!orderable || (hasVariants && !selectedVariant)}
                  onClick={handleAddToCart}
                  className={`rounded-full px-6 py-3 text-sm font-semibold transition ${
                    orderable && (!hasVariants || selectedVariant)
                      ? "bg-gray-900 text-white hover:bg-gray-700 dark:bg-brand-500 dark:text-gray-900 dark:hover:bg-brand-400"
                      : "bg-gray-900 text-white opacity-50 dark:bg-slate-700"
                  }`}
                >
                  {!orderable
                    ? "Out of Stock"
                    : hasVariants && !selectedVariant
                      ? "Select an option"
                      : preorderable
                        ? "Pre-order"
                        : "Add to Cart"}
                </button>
              </div>
              {preorderable ? (
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-3">
                  Pre-order — you pay now and we ship as soon as it arrives.
                  {availabilityCopy ? ` ${availabilityCopy}.` : ""}
                  {product.preorder?.maxQty ? ` Limit ${product.preorder.maxQty} per order.` : ""}
                </p>
              ) : (
                <p className="text-xs text-gray-600 dark:text-slate-500 mt-3">
                  You&apos;ll choose a delivery zone at checkout — stock is confirmed at payment.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* TABS (T39) — Description / Specs / Reviews */}
        <div className="mt-16">
          <div
            role="tablist"
            aria-label="Product details"
            className="flex gap-2 flex-wrap border-b border-gray-100 dark:border-slate-800 pb-4"
          >
            {tabs.map((tab) => {
              const selected = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={tabId(tab)}
                  aria-selected={selected}
                  aria-controls={panelId(tab)}
                  onClick={() => selectTab(tab)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                    selected
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {tab === TABS.REVIEWS ? `Reviews (${reviewCount})` : tab}
                </button>
              );
            })}
          </div>

          <div
            ref={tabPanelRef}
            role="tabpanel"
            id={panelId(activeTab)}
            aria-labelledby={tabId(activeTab)}
            tabIndex={-1}
            className="pt-8 scroll-mt-28 focus:outline-none"
          >
            {activeTab === TABS.DESCRIPTION && (
              <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line max-w-3xl">
                {product.description || "No description available for this product yet."}
              </p>
            )}

            {activeTab === TABS.SPECS && hasSpecs && (
              <dl className="divide-y divide-gray-100 dark:divide-slate-800 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden max-w-3xl">
                {product.specs.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-start justify-between gap-4 px-4 py-2.5 bg-white dark:bg-slate-900"
                  >
                    <dt className="text-xs font-semibold text-gray-500 dark:text-slate-400 pt-0.5">
                      {s.label}
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white text-right">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {activeTab === TABS.REVIEWS && <ProductReviews product={product} />}
          </div>
        </div>
      </div>
    </div>
  );
}