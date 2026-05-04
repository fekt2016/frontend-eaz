"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const statusColors = {
  pending: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

export default function DashboardDomains() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/domain/orders")
      .then((res) => setOrders(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold text-gray-900">My Domains</h2>
        <Link href="/domains" className="text-sm text-amber-500 hover:underline">Register domain</Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 flex justify-center">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
          <p className="text-gray-400 text-sm mb-4">No domain orders yet.</p>
          <Link href="/domains" className="inline-block rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition">
            Search domains
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-900">{order.domain}</p>
                <p className="text-xs text-gray-400 mt-0.5">{order.years} year{order.years > 1 ? "s" : ""} · GH₵{order.price}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
                {order.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
