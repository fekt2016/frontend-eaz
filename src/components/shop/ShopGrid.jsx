"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight, Search, ShoppingBag } from "lucide-react";
import { formatGhs, stockBadge } from "@/lib/shop";
import { useDebounce } from "@/hooks/useDebounce";
import { useShopProducts } from "@/hooks/queries/useProducts";
import StarRule from "@/components/common/StarRule";
import ProductImage from "@/components/shop/ProductImage";
import ProductStats from "@/components/shop/ProductStats";

const CATEGORIES = [
  "Phones",
  "Phone Cases & Covers",
  "Chargers & Cables",
  "Power Banks",
  "Earphones & Headphones",
  "Screen Protectors"
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name A–Z" },
];

export default function ShopGrid({ activeCategory = "" }) {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 400);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const { data, isLoading: loading, error: queryError } = useShopProducts({
    page, limit: 12, sort,
    category: activeCategory || undefined,
    q: debouncedQ.trim() || undefined,
  });
  const products = data?.data ?? [];
  const pagination = { total: data?.total ?? 0, pages: data?.pages ?? 1 };
  const error = queryError ? (queryError.message || "Failed to load products") : null;

  useEffect(() => {
    setPage(1);
  }, [activeCategory, debouncedQ, sort]);

  const heading = activeCategory || "All Products";

  return (
    <div className="bg-white dark:bg-ink text-gray-900 dark:text-slate-100 pt-16">
      {/* STICKY FILTER BAR */}
      <div className="sticky top-[64px] z-20 bg-white/95 dark:bg-ink/95 backdrop-blur border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
            <Link
              href="/shop"
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition border ${
                !activeCategory
                  ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-white"
              }`}
            >
              All
            </Link>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/shop/category/${encodeURIComponent(cat)}`}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition border ${
                  activeCategory === cat
                    ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-white"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-52">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-8 pr-8 py-2 rounded-full border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-gray-400 dark:focus:border-slate-500 transition bg-white dark:bg-slate-900"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xs"
                >
                  ×
                </button>
              )}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort products"
              className="rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-gray-600 dark:text-slate-300 focus:outline-none focus:border-gray-400 dark:focus:border-slate-500 transition"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="hidden sm:block text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">{pagination.total} products</p>
          </div>
        </div>
      </div>

      {/* PRODUCTS */}
      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-1">
                {activeCategory ? heading : "Featured Products"}
              </p>
              <StarRule className="mb-3" />
              <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white">{heading}</h2>
            </div>
            <p className="sm:hidden text-xs text-gray-400 dark:text-slate-500">{pagination.total} products</p>
          </div>

          {error ? (
<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-900 px-6 py-16 text-center">
              <AlertTriangle size={24} className="text-gray-400 dark:text-slate-500 mb-3" />
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</p>
              <p className="text-gray-400 dark:text-slate-500 text-sm mb-5 max-w-sm">{error}</p>
              <button
                type="button"
                onClick={load}
                className="rounded-full border border-gray-300 dark:border-slate-600 px-5 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-900 dark:hover:border-white hover:text-gray-900 dark:hover:text-white transition"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-100 dark:bg-slate-800" />
                  <div className="p-5 space-y-2">
                    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full w-1/3" />
                    <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-900 px-6 py-16 text-center">
              <ShoppingBag size={24} className="text-gray-400 dark:text-slate-500 mb-3" />
              <p className="font-semibold text-gray-900 dark:text-white mb-2">No products found</p>
              <p className="text-gray-400 dark:text-slate-500 text-sm mb-5 max-w-sm">Try a different category or search term.</p>
              <Link
                href="/shop"
                className="rounded-full border border-gray-300 dark:border-slate-600 px-5 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-900 dark:hover:border-white hover:text-gray-900 dark:hover:text-white transition"
              >
                View all products
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {!loading && !error && pagination.pages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft size={10} /> Prev
              </button>
              <span className="text-xs text-gray-400 dark:text-slate-500">
                Page {page} of {pagination.pages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                Next <ChevronRight size={10} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product }) {
  const badge = stockBadge(product.stock);
  const images = product.images?.length
    ? product.images
    : ["/images/product-placeholder.svg"];
  const primary = images[0];
  const secondary = images[1] || null; // shown on hover when the product has a 2nd image
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-1 transition duration-300">
      <Link href={`/shop/${product.slug}`} className="relative block overflow-hidden aspect-[4/3]">
        <ProductImage
          src={primary}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-all duration-500 group-hover:scale-105 ${secondary ? "group-hover:opacity-0" : ""}`}
        />
        {secondary && (
          <ProductImage
            src={secondary}
            alt={`${product.name} — alternate view`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
          />
        )}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}>
          {badge.label}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400 mb-0.5">{product.category}</p>
        <h3 className="font-display font-bold text-base text-gray-900 dark:text-white group-hover:text-brand-500 transition mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-gray-400 dark:text-slate-500 text-xs leading-relaxed line-clamp-3 mb-4 flex-1">{product.description}</p>
        <ProductStats views={product.views} sold={product.sold} className="mb-2.5" />
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-3">
          <div>
            <p className="font-display font-bold text-lg text-gray-900 dark:text-white">{formatGhs(product.price)}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">{product.stock > 0 ? "Available now" : "Sold out"}</p>
          </div>
          <Link
            href={`/shop/${product.slug}`}
            className="rounded-full border border-gray-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-900 dark:hover:border-white hover:text-gray-900 dark:hover:text-white transition"
          >
            View product →
          </Link>
        </div>
      </div>
    </article>
  );
}
