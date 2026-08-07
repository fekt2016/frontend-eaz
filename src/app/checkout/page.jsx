"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FaArrowLeft, FaLock } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";
import { formatGhs } from "@/lib/shop";

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition bg-white";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadZones = useCallback(async () => {
    try {
      const res = await api.get("/delivery-zones");
      const list = res.data || [];
      setZones(list);
      if (list.length === 1) setZoneId(list[0]._id);
    } catch {
      // zones are optional; checkout still works without a zone fee
    }
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const selectedZone = zones.find((z) => z._id === zoneId);
  const deliveryFee = selectedZone ? selectedZone.fee : 0;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    setError("");
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!customer.name.trim() || !customer.phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }
    if (zones.length > 0 && !zoneId) {
      setError("Please select a delivery zone.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/orders", {
        items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        ...(zoneId && { deliveryZoneId: zoneId }),
        customer,
      });
      const { authorizationUrl } = res.data;
      if (authorizationUrl) {
        clearCart();
        window.location.href = authorizationUrl;
      } else {
        setError("Unable to initialize payment. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white px-4 pt-28 pb-24">
        <div className="mx-auto max-w-md flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
          <p className="text-3xl mb-3">🛒</p>
          <p className="font-semibold text-gray-900 mb-2">Your cart is empty</p>
          <p className="text-gray-400 text-sm mb-6">Add a product to the cart before checking out.</p>
          <Link
            href="/shop"
            className="rounded-full bg-gray-900 px-5 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition"
          >
            Browse the Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 pt-28 pb-24">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/cart"
          className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
        >
          <FaArrowLeft size={10} /> Back to cart
        </Link>

        <h1 className="font-display font-black text-3xl md:text-4xl text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-500 text-sm mb-10">
          One step — tell us where to deliver and pay securely with Paystack.
        </p>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr,340px]">
          {/* LEFT: customer details + delivery zone */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-4">Delivery Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Your name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">Phone *</label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="+233 XX XXX XXXX"
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Email <span className="text-gray-400">(optional — for your receipt)</span>
                  </label>
                  <input
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">Delivery Address</label>
                  <input
                    type="text"
                    value={customer.address}
                    onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
                    placeholder="House number, street, area"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-4">Delivery Zone</h2>
              {zones.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Delivery zones are loading... (or no zones configured — no delivery fee applies.)
                </p>
              ) : (
                <div className="space-y-3">
                  {zones.map((zone) => (
                    <button
                      key={zone._id}
                      type="button"
                      onClick={() => setZoneId(zone._id)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        zoneId === zone._id ? "border-amber-300 bg-amber-50" : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{zone.name}</span>
                        <span className={`font-semibold ${zone.fee === 0 ? "text-emerald-600" : "text-amber-500"}`}>
                          {zone.fee === 0 ? "Free" : formatGhs(zone.fee)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {zone.estimatedDays} {zone.estimatedDays === 1 ? "day" : "days"} estimated delivery
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: order summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Order Summary</h3>
              <ul className="divide-y divide-gray-100 border-b border-gray-100 mb-4">
                {items.map((item) => (
                  <li key={item.slug} className="flex justify-between gap-3 py-3 text-sm">
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
                  <span className="text-gray-900">{formatGhs(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span className="text-gray-900">{deliveryFee === 0 ? "—" : formatGhs(deliveryFee)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3 font-semibold text-base">
                  <span className="text-gray-900">Total</span>
                  <span className="text-amber-500">{formatGhs(total)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={loading}
                className="mt-5 w-full rounded-full bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition disabled:opacity-60"
              >
                {loading ? "Processing..." : `Pay ${formatGhs(total)} Securely`}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <FaLock size={10} /> Secured by Paystack — card &amp; mobile money
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
