"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatGhs, stockBadge } from "@/lib/shop";
import AdminNav from "@/components/commerce/AdminNav";

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/dashboard");
  }, [user, authLoading, router]);

  const load = () => {
    setLoading(true);
    api
      .get("/products/all")
      .then((res) => setProducts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (product) => {
    setUpdating(product._id);
    try {
      if (product.isActive) {
        await api.delete(`/products/${product._id}`);
      } else {
        await api.patch(`/products/${product._id}`, { isActive: true });
      }
      load();
    } catch (err) {
      alert(err.message || "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  if (authLoading || user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="mx-auto max-w-5xl">
        <AdminNav />
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Products</h1>
            <p className="text-gray-500 text-sm">Create, edit, and manage shop products.</p>
          </div>
          <Link
            href="/commerce/products/new"
            className="shrink-0 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition"
          >
            + Add Product
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
            <p className="text-gray-400 text-sm">No products yet. Add your first product.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const badge = stockBadge(product.stock);
              return (
                <div
                  key={product._id}
                  className={`p-4 rounded-2xl border bg-gray-50 ${
                    product.isActive ? "border-gray-100" : "border-gray-200 opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-14 w-14 rounded-xl object-cover bg-white"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                        {!product.isActive && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                            Archived
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {product.category}
                        {product.sku ? ` · SKU ${product.sku}` : ""} · /{product.slug}
                      </p>
                    </div>
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatGhs(product.price)}</p>
                      <p className={`text-xs font-medium mt-1 ${badge.classes}`}>{badge.label}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/commerce/products/${product._id}/edit`}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleToggle(product)}
                        disabled={updating === product._id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-60 ${
                          product.isActive
                            ? "border border-red-200 text-red-500 hover:bg-red-50"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {updating === product._id ? "..." : product.isActive ? "Archive" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
