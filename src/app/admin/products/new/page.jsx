"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import AdminNav from "@/components/admin/AdminNav";
import ProductForm from "@/components/admin/ProductForm";

export default function AdminNewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/dashboard");
  }, [user, authLoading, router]);

  if (authLoading || user?.role !== "admin") return null;

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      await api.post("/products", data);
      router.push("/admin/products");
    } catch (err) {
      alert(err.message || "Failed to create product");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="mx-auto max-w-2xl">
        <AdminNav />
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">New Product</h1>
        <p className="text-gray-500 text-sm mb-8">Fill in the details below to add a product.</p>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
          <ProductForm submitLabel="Create Product" submitting={submitting} onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
