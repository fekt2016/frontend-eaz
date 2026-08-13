"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatGhs, stockBadge } from "@/lib/shop";

export default function ShopSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get("/products?limit=3&sort=newest")
      .then((res) => {
        if (active) setProducts(res.data || []);
      })
      .catch((err) => {
        if (active) setError(err.message || "Failed to load products");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">The Shop</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 mb-4">
            Digital Products For Your Business
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Ready-made digital products and services — priced in Ghana cedis, delivered fast, built for African businesses.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
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
        ) : error ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-14 text-center">
            <p className="text-2xl mb-3">⚠️</p>
            <p className="font-semibold text-gray-900 mb-2">Something went wrong</p>
            <p className="text-gray-400 text-sm mb-5">{error}</p>
            <Link href="/shop" className="rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition">
              Browse the shop instead
            </Link>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-14 text-center">
            <p className="text-2xl mb-3">🛍️</p>
            <p className="font-semibold text-gray-900 mb-2">New products coming soon</p>
            <p className="text-gray-400 text-sm mb-5">Our shop is being stocked — check back shortly.</p>
            <Link href="/shop" className="rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition">
              View all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <ShopCard key={product._id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/shop"
            className="inline-flex px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition"
          >
            Shop All Products →
          </Link>
        </div>
      </div>
    </section>
  );
}

function ShopCard({ product }) {
  const badge = stockBadge(product.stock);
  const image = product.images?.[0] || "https://placehold.co/800x600/1e1b4b/ffffff?text=Product";
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-md hover:-translate-y-1 transition duration-300">
      <Link href={`/shop/${product.slug}`} className="relative block overflow-hidden aspect-[4/3]">
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
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
          <p className="font-display font-bold text-lg text-gray-900">{formatGhs(product.price)}</p>
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
