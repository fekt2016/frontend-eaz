"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { formatGhs } from "@/lib/shop";
import { useTrackOrder } from "@/hooks/queries/useOrders";

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 dark:focus:border-slate-500 transition bg-white dark:bg-slate-900";

const STATUS_STYLES = {
  pending: { label: "Pending Payment", classes: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400" },
  paid: { label: "Paid", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  processing: { label: "Processing", classes: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
  shipped: { label: "Shipped", classes: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400" },
  delivered: { label: "Delivered", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  cancelled: { label: "Cancelled", classes: "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400" },
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const trackOrder = useTrackOrder();
  const order = trackOrder.data ?? null;
  const loading = trackOrder.isPending;

  const handleTrack = (e) => {
    e.preventDefault();
    setError("");
    if (!orderNumber.trim() || !phone.trim()) {
      setError("Please enter both your order number and phone number.");
      return;
    }
    trackOrder.mutate(
      { orderNumber: orderNumber.trim(), phone: phone.trim() },
      { onError: (err) => setError(err.message || "Unable to find your order.") },
    );
  };

  const badge = order ? STATUS_STYLES[order.status] || STATUS_STYLES.pending : null;

  return (
    <div className="min-h-screen bg-white dark:bg-ink text-gray-900 dark:text-slate-100 px-4 pt-28 pb-24">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-4">Order Tracking</p>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white mb-2">Track Your Order</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-10">
          Enter the order number from your confirmation and the phone number you checked out with.
        </p>

        <form
          onSubmit={handleTrack}
          className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-900 p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Order Number</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. EZW-MSC62SYM8F9B"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Phone Number</label>
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
            <div className="mt-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 dark:bg-brand-500 py-3 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={13} />}
            {loading ? "Looking up..." : "Track Order"}
          </button>
        </form>

        {order && badge && (
          <div className="mt-8">
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-slate-500">Order Number</p>
                  <p className="font-display font-bold text-lg text-gray-900 dark:text-white">{order.orderNumber}</p>
                  {order.trackingNumber && (
                    <>
                      <p className="mt-2 text-xs text-gray-600 dark:text-slate-500">Tracking Number</p>
                      <Link
                        href={`/track/order/${order.trackingNumber}`}
                        className="font-mono text-sm font-semibold text-brand-ink dark:text-brand-400 hover:underline"
                      >
                        {order.trackingNumber}
                      </Link>
                    </>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.classes}`}>{badge.label}</span>
              </div>

              <ul className="divide-y divide-gray-100 dark:divide-slate-800 border-b border-gray-100 dark:border-slate-800 my-4">
                {order.items.map((item) => (
                  <li key={item.product || item.name} className="flex justify-between gap-3 py-3 text-sm">
                    <span className="text-gray-700 dark:text-slate-300">
                      {item.name} <span className="text-gray-600 dark:text-slate-500">× {item.qty}</span>
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatGhs(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">{formatGhs(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Delivery</span>
                  <span className="text-gray-900 dark:text-white">{order.deliveryFee > 0 ? formatGhs(order.deliveryFee) : "—"}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-3 font-semibold text-base">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-brand-500">{formatGhs(order.total)}</span>
                </div>
              </div>

              {order.customer?.address && (
                <div className="mt-5 rounded-xl bg-paper dark:bg-ink p-4 text-sm">
                  <p className="text-xs font-semibold text-gray-600 dark:text-slate-500 uppercase tracking-wider mb-1">Deliver To</p>
                  <p className="text-gray-700 dark:text-slate-300">{order.customer.name}</p>
                  <p className="text-gray-500 dark:text-slate-400">{order.customer.phone}</p>
                  <p className="text-gray-500 dark:text-slate-400">{order.customer.address}</p>
                </div>
              )}

              {(order.trackingHistory || []).length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-gray-600 dark:text-slate-500 uppercase tracking-wider mb-4">Tracking History</p>
                  <ol className="relative border-l border-gray-200 dark:border-slate-700 ml-2 space-y-6">
                    {[...order.trackingHistory].reverse().map((h, i) => (
                      <li key={i} className="ml-6">
                        <span className="absolute -left-[9px] mt-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-brand-500" />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${(STATUS_STYLES[h.status] || STATUS_STYLES.pending).classes}`}>
                            {(STATUS_STYLES[h.status] || STATUS_STYLES.pending).label}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-slate-500">
                            {new Date(h.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                        {h.note && <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{h.note}</p>}
                        {h.location && <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-500">{h.location}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/shop"
                className="rounded-full bg-gray-900 dark:bg-brand-500 px-6 py-3 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition"
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
