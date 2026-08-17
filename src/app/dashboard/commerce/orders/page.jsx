"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { formatGhs } from "@/lib/shop";
import { useOrders, useUpdateOrderStatus } from "@/hooks/queries/useOrders";

const statusColors = {
  pending: "bg-brand-50 text-brand-700",
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
  const [filter, setFilter] = useState("all");

  const isAllowed = ["admin", "superadmin", "staff"].includes(user?.role);

  useEffect(() => {
    if (!authLoading && !isAllowed) router.replace("/dashboard");
  }, [authLoading, isAllowed, router]);

  const { data: orders = [], isLoading: loading } = useOrders(
    {},
    { enabled: !authLoading && isAllowed },
  );
  const updateStatus = useUpdateOrderStatus();
  // While a row's update is in flight, mark that specific order id.
  const updating = updateStatus.isPending ? updateStatus.variables?.id : null;

  if (authLoading || !isAllowed) return null;

  const handleStatus = (order, status) => {
    updateStatus.mutate(
      { id: order._id, status },
      { onError: (err) => alert(err.message || "Update failed") },
    );
  };

  const visible = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
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
          <div className="rounded-2xl border border-gray-100 bg-paper p-8 text-center">
            <p className="text-gray-400 text-sm">No orders here.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-paper overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-gray-400 border-b border-gray-200 dark:border-slate-800 bg-gray-0">
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Update</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-100 dark:hover:bg-slate-900 transition"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/commerce/orders/${order._id}`}
                        className="font-semibold text-gray-900 hover:text-brand-600"
                      >
                        {order.orderNumber || order._id.slice(-6)}
                      </Link>
                      {order.trackingNumber && (
                        <span className="block text-xs text-gray-400 font-mono">{order.trackingNumber}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.customer?.name || "—"}
                      {order.customer?.phone ? (
                        <span className="block text-xs text-gray-400">{order.customer.phone}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatGhs(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        disabled={updating === order._id}
                        onChange={(e) => handleStatus(order, e.target.value)}
                        className="text-xs font-semibold px-2 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 capitalize cursor-pointer disabled:opacity-50"
                      >
                        {STATUSES.filter((s) => s !== "all").map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}