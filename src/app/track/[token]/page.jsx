"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatPhoneInput } from "@/lib/sanitize";
import { formatGhs } from "@/lib/shop";
import { FaSpinner, FaCheckCircle, FaPhone, FaWrench, FaPlus, FaMinus, FaTrash, FaSearch, FaMotorcycle } from "react-icons/fa";

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 dark:focus:border-slate-500 transition bg-white dark:bg-slate-900";

const JOB_STATUS = {
  received:          { label: "Device Received",      classes: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
  diagnosing:        { label: "Diagnosing",           classes: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400" },
  waiting_for_parts: { label: "Waiting for Parts",    classes: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400" },
  repairing:         { label: "Repairing",            classes: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400" },
  ready:             { label: "Ready for Collection", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  collected:         { label: "Collected",            classes: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300" },
  cancelled:         { label: "Cancelled",            classes: "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400" },
};

const ORDER_STATUS = {
  pending:   { label: "Payment Pending", classes: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400" },
  paid:      { label: "Paid",            classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  cancelled: { label: "Cancelled",       classes: "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400" },
};

const ORDERABLE = ["received", "diagnosing", "waiting_for_parts"];

export default function TrackRepairPage() {
  const { token } = useParams();
  const searchParams = useSearchParams();
  const justPaid = searchParams.get("paid") === "1";

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Part catalogue + cart
  const [catalogue, setCatalogue] = useState([]);
  const [catQuery, setCatQuery] = useState("");
  const [cart, setCart] = useState([]); // { partId, name, sku, unitPriceGhs, quantity, stock }
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState("");

  // Order form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");

  // Outstanding-balance payment state
  const [balancePhone, setBalancePhone] = useState("");
  const [balancePaying, setBalancePaying] = useState(false);
  const [balanceError, setBalanceError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get(`/track/${token}`)
      .then((r) => setJob(r.data))
      .catch((err) => setError(err.message || "Unable to load your repair."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (token) load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (job?.customerName && !name) setName(job.customerName); }, [job]); // eslint-disable-line react-hooks/exhaustive-deps

  const canOrder = job && ORDERABLE.includes(job.status);

  // Load the orderable parts catalogue + shipping zones whenever ordering is open.
  useEffect(() => {
    if (!canOrder) return;
    api.get("/track/parts").then((r) => setCatalogue(r.data || [])).catch(() => {});
    if (job?.dropoff === "rider") {
      api.get("/delivery-zones").then((r) => {
        const list = r.data || [];
        setZones(list);
        if (list.length === 1) setZoneId(list[0]._id);
      }).catch(() => {});
    }
  }, [canOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCatalogue = useMemo(() => {
    const q = catQuery.trim().toLowerCase();
    if (!q) return catalogue;
    return catalogue.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q)
    );
  }, [catalogue, catQuery]);

  const selectedZone = zones.find((z) => z._id === zoneId);

  const addToCart = (part) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.partId === part._id);
      if (existing) {
        if (existing.quantity >= part.quantity) return prev;
        return prev.map((i) => i.partId === part._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { partId: part._id, name: part.name, sku: part.sku || "", unitPriceGhs: part.sellingPrice, quantity: 1, stock: part.quantity }];
    });
  };

  const changeQty = (partId, delta) => {
    setCart((prev) => prev.map((i) => {
      if (i.partId !== partId) return i;
      const next = i.quantity + delta;
      if (next <= 0) return i;
      if (next > i.stock) return i;
      return { ...i, quantity: next };
    }));
  };

  const removeFromCart = (partId) => setCart((prev) => prev.filter((i) => i.partId !== partId));

  const partsSubtotalGhs = cart.reduce((sum, i) => sum + i.unitPriceGhs * i.quantity, 0);
  const shippingPesewas = selectedZone && job?.dropoff === "rider" ? selectedZone.fee : 0;
  const totalPesewas = partsSubtotalGhs * 100 + shippingPesewas;

  const submitOrder = async (e) => {
    e.preventDefault();
    setOrderError("");
    if (cart.length === 0) { setOrderError("Select at least one part to order."); return; }
    if (!name.trim()) { setOrderError("Please enter your name."); return; }
    if (!phone.trim()) { setOrderError("Please enter the phone number on the receipt."); return; }
    if (job?.dropoff === "rider" && zones.length > 0 && !zoneId) { setOrderError("Please select a shipping zone."); return; }
    setPlacing(true);
    try {
      const res = await api.post(`/track/${token}/orders`, {
        items: cart.map((i) => ({ partId: i.partId, quantity: i.quantity })),
        ...(zoneId && { shippingZoneId: zoneId }),
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      window.location.href = res.data.authorizationUrl;
    } catch (err) {
      setOrderError(err.message || "Unable to start payment. Please try again.");
      setPlacing(false);
    }
  };

  const payBalance = async (e) => {
    e.preventDefault();
    setBalanceError("");
    if (!balancePhone.trim()) { setBalanceError("Please enter the phone number on the receipt."); return; }
    setBalancePaying(true);
    try {
      const res = await api.post(`/track/${token}/balance-payment`, { phone: balancePhone.trim() });
      window.location.href = res.data.authorizationUrl;
    } catch (err) {
      setBalanceError(err.message || "Unable to start payment. Please try again.");
      setBalancePaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4 pt-28 pb-24">
        <FaSpinner size={20} className="animate-spin text-gray-400 dark:text-slate-500" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 px-4 pt-28 pb-24">
        <div className="mx-auto max-w-xl text-center">
          <FaWrench size={28} className="mx-auto mb-4 text-gray-300 dark:text-slate-700" />
          <h1 className="font-display font-black text-2xl mb-2">Repair not found</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
            {error || "We couldn't find a repair for that link. Check the link from your SMS or receipt."}
          </p>
          <Link href="/" className="inline-block rounded-full bg-gray-900 dark:bg-brand-500 px-6 py-3 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition">
            Back to EazWorld
          </Link>
        </div>
      </div>
    );
  }

  const jobBadge = JOB_STATUS[job.status] || JOB_STATUS.received;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 px-4 pt-28 pb-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-4">Repair Tracking</p>
        <h1 className="font-display font-black text-3xl md:text-4xl mb-2">Track Your Repair</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-10">
          {job.customerName ? `Hi ${job.customerName}, here's the status of your device repair.` : "Here's the status of your device repair."}
        </p>

        {justPaid && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 px-5 py-4">
            <FaCheckCircle className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">Payment received. We&apos;ll start the repair once your part arrives.</p>
          </div>
        )}

        {/* Job card */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-4">
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500">Job Number</p>
              <p className="font-display font-bold text-lg">{job.jobNumber}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${jobBadge.classes}`}>{jobBadge.label}</span>
          </div>

          <dl className="my-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-400 dark:text-slate-500">Device</dt>
              <dd className="font-medium text-right">{job.device}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-400 dark:text-slate-500">Fault</dt>
              <dd className="font-medium text-right max-w-[70%]">{job.faultDescription}</dd>
            </div>
            {job.repairWork && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400 dark:text-slate-500">Repair</dt>
                <dd className="font-medium text-right max-w-[70%]">{job.repairWork}</dd>
              </div>
            )}
            {job.dropoff === "rider" && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400 dark:text-slate-500">Pickup</dt>
                <dd className="font-medium text-right max-w-[70%]">{job.pickupAddress || "Rider pickup arranged"}</dd>
              </div>
            )}
            {job.estimatedCompletion && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400 dark:text-slate-500">Estimated completion</dt>
                <dd className="font-medium">{new Date(job.estimatedCompletion).toLocaleDateString("en-GH")}</dd>
              </div>
            )}
            {job.completedAt && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-400 dark:text-slate-500">Completed</dt>
                <dd className="font-medium">{new Date(job.completedAt).toLocaleDateString("en-GH")}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Parts */}
        {(job.parts || []).length > 0 && (
          <div className="mt-8">
            <h2 className="font-display font-bold text-xl mb-1">Parts for this repair</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              {canOrder
                ? "You can pay for any of the parts below now — we&apos;ll install it once it&apos;s ready."
                : "Parts required for this repair."}
            </p>

            <div className="space-y-3">
              {job.parts.map((part) => (
                <div key={part.id} className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{part.name}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{part.quantity} × GH₵{part.priceGhs}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-lg text-brand-500">GH₵{part.priceGhs * part.quantity}</p>
                      {canOrder && part.priceGhs > 0 && (
                        <button
                          onClick={() => addToCart({ _id: part.id, name: part.name, sku: "", sellingPrice: part.priceGhs, quantity: 99 })}
                          className="mt-2 rounded-full bg-gray-900 dark:bg-brand-500 px-4 py-2 text-xs font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition"
                        >
                          Add to order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment section — catalogue + cart + shipping */}
        {canOrder && (
          <div className="mt-8">
            <h2 className="font-display font-bold text-xl mb-1">Order parts &amp; pay</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              {job.dropoff === "rider"
                ? "Pick the parts you need and we'll include the rider shipping to your pickup address."
                : "Pick the parts you need and pay now — we'll have them ready when your device is with us."}
            </p>

            {/* Catalogue */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="relative">
                <FaSearch size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input
                  value={catQuery}
                  onChange={(e) => setCatQuery(e.target.value)}
                  placeholder="Search parts (screen, battery, charging port…)"
                  className={`${inputCls} pl-10`}
                />
              </div>

              {filteredCatalogue.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400 dark:text-slate-500">
                  {catalogue.length === 0
                    ? "No parts are available to order right now. Call us on 024 438 8190 and we&apos;ll sort it out."
                    : "No parts match your search."}
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-gray-100 dark:divide-slate-800">
                  {filteredCatalogue.map((p) => {
                    const inCart = cart.find((i) => i.partId === p._id);
                    const outOfStock = p.quantity <= 0;
                    return (
                      <li key={p._id} className="flex items-center justify-between gap-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{p.name}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                            {p.sku ? `${p.sku} · ` : ""}GH₵{p.sellingPrice}{p.quantity <= 10 ? ` · only ${p.quantity} left` : ""}
                          </p>
                        </div>
                        {outOfStock ? (
                          <span className="text-xs font-semibold text-gray-400 dark:text-slate-500">Out of stock</span>
                        ) : inCart ? (
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => changeQty(p._id, -1)} className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                              <FaMinus size={10} />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">{inCart.quantity}</span>
                            <button type="button" onClick={() => changeQty(p._id, 1)} className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                              <FaPlus size={10} />
                            </button>
                            <button type="button" onClick={() => removeFromCart(p._id)} className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition" aria-label="Remove">
                              <FaTrash size={11} />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => addToCart(p)} className="rounded-full bg-gray-900 dark:bg-brand-500 px-4 py-2 text-xs font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition">
                            Add
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Checkout */}
            <form onSubmit={submitOrder} className="mt-6 space-y-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              {cart.length > 0 && (
                <div className="rounded-xl bg-gray-50 dark:bg-slate-950 p-4 space-y-2">
                  {cart.map((i) => (
                    <div key={i.partId} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-slate-300">{i.name} <span className="text-gray-400 dark:text-slate-500">× {i.quantity}</span></span>
                      <span className="font-semibold">GH₵{i.unitPriceGhs * i.quantity}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-slate-800">
                    <span className="text-gray-500 dark:text-slate-400">Subtotal</span>
                    <span className="font-medium">GH₵{partsSubtotalGhs}</span>
                  </div>
                  {job.dropoff === "rider" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-slate-400">Rider shipping</span>
                      <span className="font-medium">{shippingPesewas > 0 ? formatGhs(shippingPesewas) : "—"}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-base font-semibold pt-2 border-t border-gray-200 dark:border-slate-800">
                    <span>Total</span>
                    <span className="text-brand-500">GH₵{(totalPesewas / 100).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {job.dropoff === "rider" && zones.length > 0 && (
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-slate-300">
                    <FaMotorcycle className="text-brand-500" /> Shipping zone
                  </label>
                  <select
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className={`${inputCls} cursor-pointer`}
                  >
                    <option value="">Select your location</option>
                    {zones.map((z) => (
                      <option key={z._id} value={z._id}>{z.name} — {formatGhs(z.fee)} ({z.estimatedDays} day{z.estimatedDays > 1 ? "s" : ""})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Your name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Phone on receipt</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                  placeholder="024 000 0000"
                  className={inputCls}
                  required
                />
                <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">Must match the phone number on your repair receipt.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Email <span className="font-normal text-gray-400 dark:text-slate-500">(optional — for faster updates)</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </div>
              {orderError && <p className="text-sm text-red-600 dark:text-red-400">{orderError}</p>}
              <button
                type="submit"
                disabled={placing || cart.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 dark:bg-brand-500 py-3 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-60"
              >
                {placing ? <FaSpinner size={13} className="animate-spin" /> : <FaPhone size={12} />}
                {placing ? "Opening Paystack…" : cart.length === 0 ? "Add a part to continue" : `Pay ${(totalPesewas / 100).toFixed(2)} now`}
              </button>
            </form>
          </div>
        )}

        {/* Outstanding-balance payment — for jobs with labour/diagnosis fees
            (or any balance) the customer can settle it online with card or MoMo. */}
        {job.canPayBalance && (
          <div className="mt-8 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="font-display font-bold text-xl mb-1">Pay outstanding balance</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
              {job.dropoff === "rider"
                ? "Settle the remaining balance for your repair (parts, diagnosis and labour)."
                : "Settle the remaining balance for your repair (parts, diagnosis and labour)."}
            </p>

            <div className="rounded-xl bg-gray-50 dark:bg-slate-950 p-4 mb-5 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-slate-300">Outstanding balance</span>
              <span className="font-display font-bold text-lg text-brand-500">{formatGhs(job.balanceDuePesewas)}</span>
            </div>

            <form onSubmit={payBalance} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Phone on receipt</label>
                <input
                  type="tel"
                  value={balancePhone}
                  onChange={(e) => setBalancePhone(formatPhoneInput(e.target.value))}
                  placeholder="024 000 0000"
                  className={inputCls}
                  required
                />
                <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">Must match the phone number on your repair receipt.</p>
              </div>
              {balanceError && <p className="text-sm text-red-600 dark:text-red-400">{balanceError}</p>}
              <button
                type="submit"
                disabled={balancePaying}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 dark:bg-brand-500 py-3 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-60"
              >
                {balancePaying ? <FaSpinner size={13} className="animate-spin" /> : <FaCheckCircle size={12} />}
                {balancePaying ? "Opening Paystack…" : `Pay ${formatGhs(job.balanceDuePesewas)} now`}
              </button>
            </form>
          </div>
        )}

        {/* Order history */}
        {(job.partOrders || []).length > 0 || (job.repairOrders || []).length > 0 ? (
          <div className="mt-8 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="px-6 pt-5">
              <h2 className="font-display font-bold text-lg">Orders &amp; payments</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Payments you&apos;ve made for this repair.</p>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-slate-800 mt-3">
              {(job.repairOrders || []).map((o) => {
                const badge = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
                const names = (o.items || []).map((i) => `${i.partName} ×${i.quantity}`).join(", ");
                return (
                  <li key={o.id} className="flex items-center justify-between gap-4 px-6 py-4 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{names}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        {o.shippingFeePesewas > 0 ? "Parts + rider shipping · " : ""}
                        {new Date(o.createdAt).toLocaleDateString("en-GH")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}>{badge.label}</span>
                      <span className="font-semibold">GH₵{(o.totalPesewas / 100).toFixed(2)}</span>
                    </div>
                  </li>
                );
              })}
              {(job.partOrders || []).map((o) => {
                const badge = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
                return (
                  <li key={o.id} className="flex items-center justify-between gap-4 px-6 py-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{o.partName} <span className="text-gray-400 dark:text-slate-500">× {o.quantity}</span></p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{new Date(o.createdAt).toLocaleDateString("en-GH")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}>{badge.label}</span>
                      <span className="font-semibold">GH₵{o.amountGhs}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">Questions about your repair? Call us on <span className="font-medium text-gray-600 dark:text-slate-300">024 438 8190</span></p>
          <Link href="/" className="inline-block rounded-full border border-gray-200 dark:border-slate-700 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
            Back to EazWorld
          </Link>
        </div>
      </div>
    </div>
  );
}