"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import ProductForm from "@/components/commerce/ProductForm";
import { useAdminProduct, useUpdateProduct } from "@/hooks/queries/useProducts";

export default function AdminEditProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  const isAllowed = ["admin", "superadmin", "staff"].includes(user?.role);
  // T109 — fetch the one record, not the catalogue. This used to pull up to
  // 200 products and search the array, so editing anything past the 200th
  // newest found nothing and rendered a blank form over a product that exists.
  const { data: product = null, isLoading: loading } = useAdminProduct(id, {
    enabled: !authLoading && isAllowed,
  });

  const updateProduct = useUpdateProduct();
  const submitting = updateProduct.isPending;

  useEffect(() => {
    if (!authLoading && !isAllowed) router.replace("/dashboard");
  }, [authLoading, isAllowed, router]);

  if (authLoading || !isAllowed) return null;

  const handleSubmit = (data) => {
    updateProduct.mutate(
      { id, data },
      {
        onSuccess: () => router.push("/dashboard/commerce"),
        onError: (err) => alert(err.message || "Failed to update product"),
      },
    );
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Edit Product</h1>
        <p className="text-gray-500 text-sm mb-8">Update the product details below.</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : !product ? (
          <div className="rounded-2xl border border-gray-100 bg-paper p-8 text-center">
            <p className="text-gray-600 text-sm">Product not found.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-paper p-6">
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
