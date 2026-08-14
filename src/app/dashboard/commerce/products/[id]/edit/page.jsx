"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import ProductForm from "@/components/commerce/ProductForm";

export default function AdminEditProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !["admin", "superadmin", "staff"].includes(user?.role)) router.replace("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !["admin", "superadmin", "staff"].includes(user?.role)) return;
    api
      .get("/products/all")
      .then((res) => {
        const found = (res.data || []).find((p) => p._id === id);
        setProduct(found || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, authLoading, user]);

  if (authLoading || !["admin", "superadmin", "staff"].includes(user?.role)) return null;

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      await api.patch(`/products/${id}`, data);
      router.push("/dashboard/commerce/inventory");
    } catch (err) {
      alert(err.message || "Failed to update product");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 pt-6 pb-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Edit Product</h1>
        <p className="text-gray-500 text-sm mb-8">Update the product details below.</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : !product ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
            <p className="text-gray-400 text-sm">Product not found.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <ProductForm
              key={product._id}
              initial={product}
              submitLabel="Save Changes"
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
