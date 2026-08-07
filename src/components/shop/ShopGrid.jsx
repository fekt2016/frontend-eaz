"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight, FaSearch } from "react-icons/fa";
import { api } from "@/lib/api";
import { formatGhs, stockBadge } from "@/lib/shop";
import { useDebounce } from "@/hooks/useDebounce";

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
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: "12", sort });
    if (activeCategory) params.set("category", activeCategory);
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());

    try {
      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data || []);
      setPagination({ total: res.total || 0, pages: res.pages || 1 });
    } catch (err) {
      setError(err.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedQ, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, debouncedQ, sort]);

  const heading = activeCategory || "All Products";

  return (
    <div className="bg-white text-gray-900">
      {/* HERO */}
      <section className="pt-28 pb-10 px-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">Shop</p>
          <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 mb-4 leading-tight">
            Digital Products
            <br />
            For Your Business.
          </h1>
          <p className="text-gray-500 text-lg max-w-lg">
            Ready-made digital products and services — delivered fast, priced in Ghana cedis, built for African businesses.
          </p>
        </div>
      </section>

      {/* STICKY FILTER BAR */}
      <div className="sticky top-[64px] z-20 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
            <Link
              href="/shop"
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition border ${
                !activeCategory
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
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
                    ? "bg-gray-900 text-white border-gray-900"
                    : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-52">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search products..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pl-8 pr-8 py-2 rounded-full border border-gray-200 text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:border-gray-400 transition bg-white"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs"
                >
                  ×
                </button>
              )}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 focus:outline-none focus:border-gray-400 transition"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="hidden sm:block text-xs text-gray-400 whitespace-nowrap">{pagination.total} products</p>
          </div>
        </div>
      </div>

      {/* PRODUCTS */}
      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-1">
                {activeCategory ? heading : "Featured Products"}
              </p>
              <h2 className="font-display font-bold text-2xl text-gray-900">{heading}</h2>
            </div>
            <p className="sm:hidden text-xs text-gray-400">{pagination.total} products</p>
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
              <p className="text-2xl mb-3">⚠️</p>
              <p className="font-semibold text-gray-900 mb-2">Something went wrong</p>
              <p className="text-gray-400 text-sm mb-5 max-w-sm">{error}</p>
              <button
                type="button"
                onClick={load}
                className="rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-100" />
                  <div className="p-5 space-y-2">
                    <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                    <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
              <p className="text-2xl mb-3">🛍️</p>
              <p className="font-semibold text-gray-900 mb-2">No products found</p>
              <p className="text-gray-400 text-sm mb-5 max-w-sm">Try a different category or search term.</p>
              <Link
                href="/shop"
                className="rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition"
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
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-gray-400 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                <FaChevronLeft size={10} /> Prev
              </button>
              <span className="text-xs text-gray-400">
                Page {page} of {pagination.pages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-gray-400 transition disabled:opacity-40 disabled:pointer-events-none"
              >
                Next <FaChevronRight size={10} />
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
  const image = product.images?.[0] || "https://placehold.co/800x600/1e1b4b/ffffff?text=Product";
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md hover:-translate-y-1 transition duration-300">
      <Link href={`/shop/${product.slug}`} className="relative block overflow-hidden aspect-[4/3]">
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}>
          {badge.label}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-500 mb-0.5">{product.category}</p>
        <h3 className="font-display font-bold text-base text-gray-900 group-hover:text-amber-500 transition mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-4 flex-1">{product.description}</p>
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div>
            <p className="font-display font-bold text-lg text-gray-900">{formatGhs(product.price)}</p>
            <p className="text-xs text-gray-400">{product.stock > 0 ? "Available now" : "Sold out"}</p>
          </div>
          <Link
            href={`/shop/${product.slug}`}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition"
          >
            View product →
          </Link>
        </div>
      </div>
    </article>
  );
}
