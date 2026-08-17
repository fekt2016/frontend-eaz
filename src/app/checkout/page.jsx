"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FaArrowLeft, FaLock, FaTrash, FaPlus, FaTimes } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatGhs } from "@/lib/shop";

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 dark:focus:border-slate-500 transition bg-white dark:bg-slate-900";

const STORAGE_KEY = "eazworld_shipping_addresses";
const MAX_SAVED = 3;

function pickSavedAddresses() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((a) => a && (a.street || a.neighborhood || a.city))
      .slice(0, MAX_SAVED);
  } catch {
    return [];
  }
}

function persistLocal(address) {
  try {
    const current = pickSavedAddresses();
    const line = [address.street, address.neighborhood, address.city]
      .map((p) => (p || "").trim())
      .filter(Boolean)
      .join(", ");
    if (!line) return;
    const next = [address, ...current.filter((a) => `${a.street}|${a.neighborhood}|${a.city}` !== `${address.street}|${address.neighborhood}|${address.city}`)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, MAX_SAVED)));
  } catch {
    // localStorage unavailable — addresses just won't be saved
  }
}

function addressLine(a) {
  return [a.street, a.neighborhood, a.city]
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", street: "", neighborhood: "", city: "" });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({ label: "", street: "", neighborhood: "", city: "" });
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    if (user) {
      // Logged-in user — saved addresses live on their account in MongoDB.
      api
        .get("/auth/me/addresses")
        .then((r) => setSavedAddresses(Array.isArray(r.data) ? r.data : []))
        .catch(() => setSavedAddresses(pickSavedAddresses()));
    } else {
      // Guest — fall back to saved addresses on this device.
      setSavedAddresses(pickSavedAddresses());
    }
  }, [user]);

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

  const openModal = () => {
    setModalForm({ label: "", street: "", neighborhood: "", city: "" });
    setModalError("");
    setModalOpen(true);
  };

  const selectSavedAddress = (addr) => {
    setCustomer((c) => ({
      ...c,
      street: addr.street || "",
      neighborhood: addr.neighborhood || "",
      city: addr.city || "",
    }));
  };

  const saveModalAddress = async () => {
    setModalError("");
    const saved = {
      label: modalForm.label.trim(),
      street: modalForm.street.trim(),
      neighborhood: modalForm.neighborhood.trim(),
      city: modalForm.city.trim(),
    };
    if (!addressLine(saved)) {
      setModalError("Enter at least a street address, neighborhood, or city.");
      return;
    }
    setModalSaving(true);
    try {
      if (user) {
        const sRes = await api.post("/auth/me/addresses", saved);
        setSavedAddresses((prev) => {
          const without = prev.filter((a) => addressLine(a) !== addressLine(saved));
          return [sRes.data, ...without];
        });
      } else {
        persistLocal(saved);
        setSavedAddresses(pickSavedAddresses());
      }
      // Select the newly saved address.
      setCustomer((c) => ({
        ...c,
        street: saved.street,
        neighborhood: saved.neighborhood,
        city: saved.city,
      }));
      setModalOpen(false);
    } catch (err) {
      setModalError(err.message || "Could not save the address. Please try again.");
    } finally {
      setModalSaving(false);
    }
  };

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
      const address = addressLine(customer);
      const res = await api.post("/orders", {
        items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        ...(zoneId && { deliveryZoneId: zoneId }),
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.trim(),
          email: user?.email || "",
          address,
        },
      });
      const { authorizationUrl } = res.data;
      if (authorizationUrl) {
        const saved = {
          street: customer.street.trim(),
          neighborhood: customer.neighborhood.trim(),
          city: customer.city.trim(),
        };
        if (user) {
          // Persist to the account (MongoDB) so it can be picked next time.
          const sRes = await api.post("/auth/me/addresses", saved).catch(() => null);
          if (sRes?.data) {
            setSavedAddresses((prev) => {
              const without = prev.filter((a) => addressLine(a) !== addressLine(saved));
              return [sRes.data, ...without];
            });
          }
        } else {
          persistLocal(saved);
          setSavedAddresses(pickSavedAddresses());
        }
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
      <div className="min-h-screen bg-white dark:bg-ink px-4 pt-28 pb-24">
        <div className="mx-auto max-w-md flex flex-col items-center rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-900 px-6 py-16 text-center">
          <p className="text-3xl mb-3">🛒</p>
          <p className="font-semibold text-gray-900 dark:text-white mb-2">Your cart is empty</p>
          <p className="text-gray-400 dark:text-slate-500 text-sm mb-6">Add a product to the cart before checking out.</p>
          <Link
            href="/shop"
            className="rounded-full bg-gray-900 dark:bg-brand-500 px-5 py-2 text-xs font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition"
          >
            Browse the Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-ink px-4 pt-28 pb-24">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/cart"
          className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <FaArrowLeft size={10} /> Back to cart
        </Link>

        <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white mb-2">Checkout</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-10">
          One step — tell us where to deliver and pay securely with Paystack.
        </p>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr,340px]">
          {/* LEFT: customer details + delivery zone */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-900 p-6">
              <h2 className="font-display text-xl font-semibold text-gray-900 dark:text-white mb-4">Delivery Details</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                    placeholder="Your name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Phone *</label>
                  <input
                    type="tel"
                    value={customer.phone}
                    onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                    placeholder="+233 XX XXX XXXX"
                    className={inputCls}
                  />
                </div>
              </div>

              <label className="mb-2 mt-6 block text-xs font-medium text-gray-700 dark:text-slate-300">
                Delivery Address
              </label>

              {savedAddresses.length > 0 && (
                <div className="space-y-2">
                  {savedAddresses.map((addr) => {
                    const line = addressLine(addr);
                    const selected =
                      customer.street.trim() === (addr.street || "").trim() &&
                      customer.neighborhood.trim() === (addr.neighborhood || "").trim() &&
                      customer.city.trim() === (addr.city || "").trim();
                    return (
                      <label
                        key={addr._id || line}
                        className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                          selected
                            ? "border-brand-300 bg-brand-50 dark:border-brand-500/50 dark:bg-brand-500/10"
                            : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-ink dark:hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="saved-address"
                          checked={selected}
                          onChange={() => selectSavedAddress(addr)}
                          className="mt-1 h-4 w-4 accent-brand-500 flex-shrink-0"
                        />
                        <span className="flex-1 text-left">
                          <span className="text-sm text-gray-700 dark:text-slate-300 break-words block">{line}</span>
                          {addr.label && <span className="text-xs font-medium text-gray-400 dark:text-slate-500 mt-0.5 block">{addr.label}</span>}
                        </span>
                        {addr._id && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              try {
                                await api.delete(`/auth/me/addresses/${addr._id}`);
                                setSavedAddresses((prev) => prev.filter((a) => a._id !== addr._id));
                              } catch {
                                /* ignore — selection still works */
                              }
                            }}
                            aria-label="Delete this address"
                            className="mt-0.5 p-1.5 text-gray-400 hover:text-red-500 transition"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </label>
                    );
                  })}
                  {savedAddresses.length >= 3 && (
                    <p className="pt-1 text-xs text-gray-400 dark:text-slate-500">
                      Maximum of 3 saved addresses — delete one to add another.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={openModal}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 px-4 py-3 text-sm font-semibold text-gray-500 dark:text-slate-400 hover:border-brand-400 hover:text-brand-500 dark:hover:border-brand-500 dark:hover:text-brand-400 transition"
                >
                  <FaPlus size={12} /> {addressLine(customer) ? "Change address" : "Add delivery address"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-900 p-6">
              <h2 className="font-display text-xl font-semibold text-gray-900 dark:text-white mb-4">Delivery Zone</h2>
              {zones.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500">
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
                        zoneId === zone._id
                          ? "border-brand-300 bg-brand-50 dark:border-brand-500/50 dark:bg-brand-500/10"
                          : "border-gray-100 bg-white hover:border-gray-200 dark:border-slate-800 dark:bg-ink dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white">{zone.name}</span>
                        <span className={`font-semibold ${zone.fee === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-brand-500"}`}>
                          {zone.fee === 0 ? "Free" : formatGhs(zone.fee)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
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
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-900 p-6">
              <h3 className="text-sm font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4">Order Summary</h3>
              <ul className="divide-y divide-gray-100 dark:divide-slate-800 border-b border-gray-100 dark:border-slate-800 mb-4">
                {items.map((item) => (
                  <li key={item.slug} className="flex justify-between gap-3 py-3 text-sm">
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
                  <span className="text-gray-900 dark:text-white">{formatGhs(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Delivery</span>
                  <span className="text-gray-900 dark:text-white">{deliveryFee === 0 ? "—" : formatGhs(deliveryFee)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-3 font-semibold text-base">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-brand-500">{formatGhs(total)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={loading}
                className="mt-5 w-full rounded-full bg-gray-900 dark:bg-brand-500 py-3 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-60"
              >
                {loading ? "Processing..." : `Pay ${formatGhs(total)} Securely`}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
                <FaLock size={10} /> Secured by Paystack — card &amp; mobile money
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save address modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-white">Add a New Address</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">
                  Label <span className="text-gray-400 dark:text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={modalForm.label}
                  onChange={(e) => setModalForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Home, Office"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Street Address</label>
                <input
                  type="text"
                  value={modalForm.street}
                  onChange={(e) => setModalForm((f) => ({ ...f, street: e.target.value }))}
                  placeholder="House number and street"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Neighborhood</label>
                  <input
                    type="text"
                    value={modalForm.neighborhood}
                    onChange={(e) => setModalForm((f) => ({ ...f, neighborhood: e.target.value }))}
                    placeholder="e.g. Nima"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">City</label>
                  <input
                    type="text"
                    value={modalForm.city}
                    onChange={(e) => setModalForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. Accra"
                    className={inputCls}
                  />
                </div>
              </div>

              {modalError && <p className="text-sm text-red-600 dark:text-red-400">{modalError}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-full border border-gray-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-paper dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveModalAddress}
                  disabled={modalSaving}
                  className="flex-1 rounded-full bg-gray-900 dark:bg-brand-500 py-2.5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-60"
                >
                  {modalSaving ? "Saving…" : "Save Address"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
