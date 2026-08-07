"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from "react-icons/fa";
import { api } from "@/lib/api";
import { formatGhs } from "@/lib/shop";

export default function OrderConfirmationPage({ params }) {
  const reference = params.reference;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polls, setPolls] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/orders/by-reference/${reference}`);
      setOrder(res.data);
    } catch (err) {
      setError(err.message || "Order not found");
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!order || order.status === "paid" || polls >= 8) return;
    const t = setTimeout(() => {
      setPolls((p) => p + 1);
      load();
    }, 4000);
    return () => clearTimeout(t);
  }, [order, polls, load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 pt-32 pb-24 flex justify-center">
        <div className="flex flex-col items-center pt-10 text-center">
          <FaSpinner size={28} className="animate-spin text-amber-500 mb-4" />
          <p className="text-sm text-gray-500">Confirming your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white px-4 pt-32 pb-24">
        <div className="mx-auto max-w-md flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
          <FaExclamationTriangle size={28} className="text-amber-500 mb-3" />
          <p className="font-semibold text-gray-900 mb-2">Order not found</p>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <Link
            href="/shop"
            className="rounded-full bg-gray-900 px-5 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition"
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
    <div className="min-h-screen bg-white px-4 pt-28 pb-24">
      <div className="mx-auto max-w-2xl">
        <div
          className={`rounded-2xl border p-8 text-center ${
            isPaid ? "border-emerald-100 bg-emerald-50" : "border-gray-100 bg-gray-50"
          }`}
        >
          {isPaid ? (
            <FaCheckCircle size={40} className="mx-auto text-emerald-500 mb-4" />
          ) : (
            <FaSpinner size={40} className="mx-auto animate-spin text-amber-500 mb-4" />
          )}
          <h1 className="font-display font-black text-2xl md:text-3xl text-gray-900 mb-2">
            {isPaid ? "Payment Confirmed" : isPending ? "Confirming Payment..." : "Order Received"}
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            {isPaid
              ? `Thank you, ${order.customer?.name?.split(" ")[0] || "there"} — your order is confirmed.`
              : isPending
                ? "Paystack is confirming your payment — this usually takes a few seconds."
                : `Your order is currently "${order.status}".`}
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs text-gray-500">
            Order number <span className="font-bold text-gray-900">{order.orderNumber}</span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Order Summary</h3>
          <ul className="divide-y divide-gray-100 border-b border-gray-100 mb-4">
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
        </div>

        {order.customer?.address && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Delivery</h3>
            <p className="text-sm text-gray-700">{order.customer.name}</p>
            <p className="text-sm text-gray-500">{order.customer.phone}</p>
            <p className="text-sm text-gray-500">{order.customer.address}</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition"
          >
            Continue Shopping
          </Link>
          <Link
            href="/track-order"
            className="rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-gray-400 transition"
          >
            Track Your Order
          </Link>
        </div>
      </div>
    </div>
  );
}
