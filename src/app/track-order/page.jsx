"use client";

import { useState } from "react";
import Link from "next/link";
import { FaSearch, FaSpinner } from "react-icons/fa";
import { api } from "@/lib/api";
import { formatGhs } from "@/lib/shop";

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition bg-white";

const STATUS_STYLES = {
  pending: { label: "Pending Payment", classes: "bg-amber-50 text-amber-700" },
  paid: { label: "Paid", classes: "bg-emerald-50 text-emerald-700" },
  processing: { label: "Processing", classes: "bg-blue-50 text-blue-700" },
  shipped: { label: "Shipped", classes: "bg-violet-50 text-violet-700" },
  delivered: { label: "Delivered", classes: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", classes: "bg-gray-100 text-gray-500" },
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    if (!orderNumber.trim() || !phone.trim()) {
      setError("Please enter both your order number and phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/orders/track", {
        orderNumber: orderNumber.trim(),
        phone: phone.trim(),
      });
      setOrder(res.data);
    } catch (err) {
      setError(err.message || "Unable to find your order.");
    } finally {
      setLoading(false);
    }
  };

  const badge = order ? STATUS_STYLES[order.status] || STATUS_STYLES.pending : null;

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 pt-28 pb-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">Order Tracking</p>
        <h1 className="font-display font-black text-3xl md:text-4xl text-gray-900 mb-2">Track Your Order</h1>
        <p className="text-gray-500 text-sm mb-10">
          Enter the order number from your confirmation and the phone number you checked out with.
        </p>

        <form
          onSubmit={handleTrack}
          className="rounded-2xl border border-gray-100 bg-gray-50 p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Order Number</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. EZW-MSC62SYM8F9B"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 XX XXX XXXX"
                className={inputCls}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition disabled:opacity-60"
          >
            {loading ? <FaSpinner size={14} className="animate-spin" /> : <FaSearch size={13} />}
            {loading ? "Looking up..." : "Track Order"}
          </button>
        </form>

        {order && badge && (
          <div className="mt-8">
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-xs text-gray-400">Order Number</p>
                  <p className="font-display font-bold text-lg text-gray-900">{order.orderNumber}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.classes}`}>{badge.label}</span>
              </div>

              <ul className="divide-y divide-gray-100 border-b border-gray-100 my-4">
                {order.items.map((item) => (
                  <li key={item.product || item.name} className="flex justify-between gap-3 py-3 text-sm">
                    <span className="text-gray-700">
                      {item.name} <span className="text-gray-400">× {item.qty}</span>
                    </span>
                    <span className="font-medium text-gray-900">{formatGhs(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatGhs(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span className="text-gray-900">{order.deliveryFee > 0 ? formatGhs(order.deliveryFee) : "—"}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3 font-semibold text-base">
                  <span className="text-gray-900">Total</span>
                  <span className="text-amber-500">{formatGhs(order.total)}</span>
                </div>
              </div>

              {order.customer?.address && (
                <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Deliver To</p>
                  <p className="text-gray-700">{order.customer.name}</p>
                  <p className="text-gray-500">{order.customer.phone}</p>
                  <p className="text-gray-500">{order.customer.address}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/shop"
                className="rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
