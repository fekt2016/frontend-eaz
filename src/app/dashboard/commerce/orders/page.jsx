"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { formatGhs } from "@/lib/shop";

const statusColors = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-blue-50 text-blue-700",
  processing: "bg-indigo-50 text-indigo-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

const STATUSES = ["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled"];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !["admin", "superadmin"].includes(user?.role)) router.replace("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !["admin", "superadmin"].includes(user?.role)) return;
    api
      .get("/orders")
      .then((res) => setOrders(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || !["admin", "superadmin"].includes(user?.role)) return null;

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 pt-6 pb-24">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Orders</h1>
        <p className="text-gray-500 text-sm mb-6">Review and manage all shop orders.</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
                filter === s
                  ? "bg-gray-900 text-white"
                  : "border border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {s}
              <span className="ml-1 opacity-70">
                {s === "all" ? orders.length : orders.filter((o) => o.status === s).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
            <p className="text-gray-400 text-sm">No orders here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((order) => (
              <Link
                key={order._id}
                href={`/dashboard/commerce/orders/${order._id}`}
                className="block p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:border-gray-300 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {order.customer?.name} · {order.customer?.phone}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{formatGhs(order.total)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {order.items?.reduce((n, i) => n + (i.qty || 0), 0) || 0} items
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
