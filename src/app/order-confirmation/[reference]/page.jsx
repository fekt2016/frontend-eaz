"use client";

import Link from "next/link";
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from "react-icons/fa";
import { formatGhs } from "@/lib/shop";
import { useOrderByReference } from "@/hooks/queries/useOrders";

export default function OrderConfirmationPage({ params }) {
  const reference = params.reference;
  // The hook polls every 4s while unpaid and stops once the order is paid.
  const { data: order, isLoading: loading, error: queryError } = useOrderByReference(reference);
  const error = queryError ? (queryError.message || "Order not found") : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-ink px-4 pt-32 pb-24 flex justify-center">
        <div className="flex flex-col items-center pt-10 text-center">
          <FaSpinner size={28} className="animate-spin text-brand-500 mb-4" />
          <p className="text-sm text-gray-500 dark:text-slate-400">Confirming your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white dark:bg-ink px-4 pt-32 pb-24">
        <div className="mx-auto max-w-md flex flex-col items-center rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-900 px-6 py-16 text-center">
          <FaExclamationTriangle size={28} className="text-brand-500 mb-3" />
          <p className="font-semibold text-gray-900 dark:text-white mb-2">Order not found</p>
          <p className="text-gray-400 dark:text-slate-500 text-sm mb-6">{error}</p>
          <Link
            href="/shop"
            className="rounded-full bg-gray-900 dark:bg-brand-500 px-5 py-2 text-xs font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition"
          >
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.status === "paid";
  const isPending = order.status === "pending";

  return (
    <div className="min-h-screen bg-white dark:bg-ink px-4 pt-28 pb-24">
      <div className="mx-auto max-w-2xl">
        <div
          className={`rounded-2xl border p-8 text-center ${
            isPaid
              ? "border-emerald-100 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
              : "border-gray-100 bg-paper dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          {isPaid ? (
            <FaCheckCircle size={40} className="mx-auto text-emerald-500 mb-4" />
          ) : (
            <FaSpinner size={40} className="mx-auto animate-spin text-brand-500 mb-4" />
          )}
          <h1 className="font-display font-bold text-2xl md:text-3xl text-gray-900 dark:text-white mb-2">
            {isPaid ? "Payment Confirmed" : isPending ? "Confirming Payment..." : "Order Received"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            {isPaid
              ? `Thank you, ${order.customer?.name?.split(" ")[0] || "there"} — your order is confirmed.`
              : isPending
                ? "Paystack is confirming your payment — this usually takes a few seconds."
                : `Your order is currently "${order.status}".`}
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-ink px-4 py-1.5 text-xs text-gray-500 dark:text-slate-400">
            Order number <span className="font-bold text-gray-900 dark:text-white">{order.orderNumber}</span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-sm font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4">Order Summary</h3>
          <ul className="divide-y divide-gray-100 dark:divide-slate-800 border-b border-gray-100 dark:border-slate-800 mb-4">
            {order.items.map((item) => (
              <li key={item.product || item.name} className="flex justify-between gap-3 py-3 text-sm">
                <span className="text-gray-700 dark:text-slate-300">
                  {item.name} <span className="text-gray-400 dark:text-slate-500">× {item.qty}</span>
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
        </div>

        {order.customer?.address && (
          <div className="mt-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h3 className="text-sm font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Delivery</h3>
            <p className="text-sm text-gray-700 dark:text-slate-300">{order.customer.name}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">{order.customer.phone}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">{order.customer.address}</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="rounded-full bg-gray-900 dark:bg-brand-500 px-6 py-3 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition"
          >
            Continue Shopping
          </Link>
          <Link
            href="/track-order"
            className="rounded-full border border-gray-200 dark:border-slate-700 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition"
          >
            Track Your Order
          </Link>
        </div>
      </div>
    </div>
  );
}
