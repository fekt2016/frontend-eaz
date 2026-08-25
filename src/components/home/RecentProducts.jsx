"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatGhs, stockBadge } from "@/lib/shop";
import StarRule from "@/components/common/StarRule";
import ProductImage from "@/components/shop/ProductImage";
import ProductStats from "@/components/shop/ProductStats";

// Shop showcase on the homepage — a quick look at the newest items, placed after
// the agency story & proof.
export default function RecentProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get("/products?limit=8&sort=newest&kind=product")
      .then((res) => { if (active) setProducts(res.data || []); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Nothing in the shop yet — keep the space under the hero clean.
  if (!loading && products.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-2">Just Added</p>
            <StarRule className="mb-4" />
            <h2 className="font-display font-bold text-2xl md:text-3xl text-gray-900 dark:text-white">
              Recent Products
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex text-sm font-semibold text-gray-700 dark:text-slate-300 hover:text-brand-500 transition"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="aspect-[4/3] bg-gray-100 dark:bg-slate-800" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full w-1/3" />
                  <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <RecentCard key={product._id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/shop"
            className="inline-flex px-6 py-3 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-brand-400 transition"
          >
            Shop All Products →
          </Link>
        </div>
      </div>
    </section>
  );
}

function RecentCard({ product }) {
  const badge = stockBadge(product.stock, product.preorder?.enabled);
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
          sizes="(max-width: 768px) 50vw, 25vw"
          className={`object-cover transition-all duration-500 group-hover:scale-105 ${secondary ? "group-hover:opacity-0" : ""}`}
        />
        {secondary && (
          <ProductImage
            src={secondary}
            alt={`${product.name} — alternate view`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
          />
        )}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}>
          {badge.label}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400 mb-0.5 truncate">{product.category}</p>
        <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white group-hover:text-brand-500 transition mb-2 line-clamp-2">
          {product.name}
        </h3>
        <div className="mt-auto">
          <ProductStats views={product.views} sold={product.sold} className="mb-2.5" />
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-3">
            <p className="font-display font-bold text-base text-gray-900 dark:text-white">{formatGhs(product.price)}</p>
            <Link
              href={`/shop/${product.slug}`}
              className="rounded-full border border-gray-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-900 dark:hover:border-brand-500 hover:text-gray-900 dark:hover:text-brand-400 transition"
            >
              View →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
