"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatGhs } from "@/lib/shop";
import AdminNav from "@/components/admin/AdminNav";

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

const statusColors = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-blue-50 text-blue-700",
  processing: "bg-indigo-50 text-indigo-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/dashboard");
  }, [user, authLoading, router]);

  const load = () => {
    if (authLoading || user?.role !== "admin") return;
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, authLoading, user]);

  if (authLoading || user?.role !== "admin") return null;

  const handleStatus = async (status) => {
    setUpdating(true);
    try {
      await api.patch(`/orders/${id}`, { status });
      load();
    } catch (err) {
      alert(err.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 pt-24 pb-24">
        <div className="mx-auto max-w-3xl flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white px-4 pt-24 pb-24">
        <div className="mx-auto max-w-3xl">
          <AdminNav />
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
            <p className="text-gray-400 text-sm">Order not found.</p>
            <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-gray-900 mt-2 inline-block">
              ← Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const zone = order.deliveryZone;
  const deliveryFee = zone?.fee != null ? zone.fee : order.deliveryFee;

  return (
    <div className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="mx-auto max-w-3xl">
        <AdminNav />
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">{order.orderNumber}</h1>
            <p className="text-gray-500 text-sm">Placed {formatDate(order.createdAt)}</p>
          </div>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
            {order.status}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-2">Customer</h2>
          <Row label="Name" value={order.customer?.name || "—"} />
          <Row label="Phone" value={order.customer?.phone || "—"} />
          <Row label="Email" value={order.customer?.email || "—"} />
          <Row label="Address" value={order.customer?.address || "—"} />
          <Row label="Delivery Zone" value={zone?.name || "—"} />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Items</h2>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={item._id || i} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">Qty {item.qty} × {formatGhs(item.price)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 shrink-0">
                  {formatGhs(item.price * item.qty)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 mb-6">
          <Row label="Subtotal" value={formatGhs(order.subtotal)} />
          <Row label="Delivery Fee" value={formatGhs(deliveryFee)} />
          <div className="flex justify-between gap-4 pt-2">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-sm font-bold text-gray-900">{formatGhs(order.total)}</span>
          </div>
          {order.paystackReference && <Row label="Payment Reference" value={order.paystackReference} />}
          {order.paidAt && <Row label="Paid At" value={formatDate(order.paidAt)} />}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatus(s)}
                disabled={updating || s === order.status}
                className={`text-xs font-semibold px-3.5 py-2 rounded-full capitalize transition disabled:opacity-50 ${
                  s === order.status
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {updating ? "..." : s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
