"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const statusColors = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-blue-50 text-blue-700",
  active: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  failed: "bg-red-50 text-red-700",
};

export default function AdminHostingOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    api.get("/hosting/orders")
      .then((res) => setOrders(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await api.patch(`/hosting/orders/${orderId}`, { status });
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status } : o));
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
        <Link href="/dashboard" className="mb-6 inline-block text-sm text-gray-400 hover:text-gray-700 transition">
          ← Back to Dashboard
        </Link>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Hosting Orders</h1>
        <p className="text-gray-500 text-sm mb-8">Review and manage all hosting orders.</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
            <p className="text-gray-400 text-sm">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {order.planType} — {order.tier}
                      <span className="ml-2 font-normal text-gray-400 capitalize">({order.billingCycle})</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{order.customer?.name} · {order.customer?.email}</p>
                    <p className="text-xs text-gray-400">GH₵{order.amount} · {order.paymentMethod?.replace("_", " ")}</p>
                    {order.proofUploadUrl && (
                      <a href={order.proofUploadUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-500 hover:underline mt-1 inline-block">
                        View payment proof →
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                      {order.status}
                    </span>
                    {order.status === "pending" && (
                      <button
                        onClick={() => handleStatusUpdate(order._id, "paid")}
                        disabled={updating === order._id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition disabled:opacity-60"
                      >
                        {updating === order._id ? "..." : "Mark Paid"}
                      </button>
                    )}
                    {order.status === "paid" && (
                      <button
                        onClick={() => handleStatusUpdate(order._id, "active")}
                        disabled={updating === order._id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60"
                      >
                        {updating === order._id ? "..." : "Activate"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
