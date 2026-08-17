"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/commerce/ProductForm";
import { useCreateProduct } from "@/hooks/queries/useProducts";

export default function AdminNewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const createProduct = useCreateProduct();
  const submitting = createProduct.isPending;

  useEffect(() => {
    if (!authLoading && !["admin", "superadmin", "staff"].includes(user?.role)) router.replace("/dashboard");
  }, [user, authLoading, router]);

  if (authLoading || !["admin", "superadmin", "staff"].includes(user?.role)) return null;

  const handleSubmit = (data) => {
    createProduct.mutate(data, {
      onSuccess: () => router.push("/dashboard/commerce/inventory"),
      onError: (err) => alert(err.message || "Failed to create product"),
    });
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">New Product</h1>
        <p className="text-gray-500 text-sm mb-8">Fill in the details below to add a product.</p>
        <div className="rounded-2xl border border-gray-100 bg-paper p-6">
          <ProductForm submitLabel="Create Product" submitting={submitting} onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
