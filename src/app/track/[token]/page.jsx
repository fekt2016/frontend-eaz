"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatPhoneInput } from "@/lib/sanitize";
import { formatGhs, stockBadge, placeholderToPng } from "@/lib/shop";
import { useDebounce } from "@/hooks/useDebounce";
import { usePublicParts } from "@/hooks/queries/usePublicParts";
import { useCart } from "@/context/CartContext";
import { Loader2, CheckCircle2, Phone, Wrench, Search, Motorbike, ShoppingCart } from "lucide-react";

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
  const { addItem, openCart } = useCart();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Part catalogue + cart
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

  const debouncedQuery = useDebounce(catQuery, 300);

  // Orderable parts catalogue from the real inventory (Part model — the same
  // stock the POS sells from). Only fetched while ordering is open; the search
  // term is debounced and resolved server-side so results are always current.
  const { data: catalogue = [], isLoading: catalogueLoading } = usePublicParts(
    { q: debouncedQuery },
    { enabled: !!canOrder },
  );

  useEffect(() => {
    if (!canOrder || job?.dropoff !== "rider") return;
    api.get("/delivery-zones").then((r) => {
      const list = r.data || [];
      setZones(list);
      if (list.length === 1) setZoneId(list[0]._id);
    }).catch(() => {});
  }, [canOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedZone = zones.find((z) => z._id === zoneId);

  const addPartToShopCart = (part) => {
    addItem({
      slug: `part-${part._id}`,
      name: part.name,
      price: Math.round(Number(part.sellingPrice)),
      images: part.images || [],
      category: part.category,
      stock: part.quantity,
    });
    openCart();
  };

  const addToCart = (part) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.partId === part._id);
      if (existing) {
        if (existing.quantity >= part.quantity) return prev;
        return prev.map((i) => i.partId === part._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { partId: part._id, name: part.name, sku: part.sku || "", unitPriceGhs: Math.round(Number(part.sellingPrice)) / 100, quantity: 1, stock: part.quantity }];
    });
  };

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
<div className="min-h-screen bg-white dark:bg-ink flex items-center justify-center px-4 pt-28 pb-24">
        <Loader2 size={20} className="animate-spin text-gray-400 dark:text-slate-500" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-white dark:bg-ink text-gray-900 dark:text-slate-100 px-4 pt-28 pb-24">
        <div className="mx-auto max-w-xl text-center">
<Wrench size={28} className="mx-auto mb-4 text-gray-300 dark:text-slate-700" />
          <h1 className="font-display font-bold text-2xl mb-2">Repair not found</h1>
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
    <div className="min-h-screen bg-white dark:bg-ink text-gray-900 dark:text-slate-100 px-4 pt-28 pb-24">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-4">Repair Tracking</p>
        <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">Track Your Repair</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-10">
          {job.customerName ? `Hi ${job.customerName}, here's the status of your device repair.` : "Here's the status of your device repair."}
        </p>

        {justPaid && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 px-5 py-4">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
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
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{part.quantity} × {formatGhs(part.priceGhs)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-lg text-brand-500">{formatGhs(part.priceGhs * part.quantity)}</p>
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
            <h2 className="font-display font-bold text-xl mb-1">Browse spare parts</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Add any part to your cart and check out securely. Parts listed for your repair can be paid for below.
            </p>

            {/* Catalogue */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="relative">
                <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                <input
                  value={catQuery}
                  onChange={(e) => setCatQuery(e.target.value)}
                  placeholder="Search parts (screen, battery, charging port…)"
                  className={`${inputCls} pl-10`}
                />
              </div>

              {catQuery.trim().length === 0 ? (
                <p className="mt-4 text-sm text-gray-400 dark:text-slate-500">
                  Search for a part to see it below and add it to your order.
                </p>
              ) : catalogueLoading ? (
                <p className="mt-4 text-sm text-gray-400 dark:text-slate-500">Searching parts…</p>
              ) : catalogue.length === 0 ? (
                <p className="mt-4 text-sm text-gray-400 dark:text-slate-500">
                  No parts match your search right now. Call us on 024 438 8190 and we&apos;ll sort it out.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {catalogue.map((p) => {
                    const badge = stockBadge(p.quantity);
                    const outOfStock = p.quantity <= 0;
                    const image = placeholderToPng(p.images?.[0] || "https://placehold.co/800x600/1e1b4b/ffffff.png?text=Part");
                    return (
                      <div key={p._id} className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-ink">
                        <div className="relative aspect-[4/3]">
                          <Image
                            src={image}
                            alt={p.name}
                            fill
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="object-cover"
                          />
                          <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classes}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-0.5">{p.category}</p>
                          <h3 className="font-display font-bold text-base text-gray-900 dark:text-white line-clamp-2">{p.name}</h3>
                          {p.sku && (
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 font-mono">{p.sku}</p>
                          )}
                          {(p.compatibleWith || []).length > 0 && (
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Fits: {p.compatibleWith.join(", ")}</p>
                          )}
                          <p className="text-gray-400 dark:text-slate-500 text-xs leading-relaxed line-clamp-3 mt-2 flex-1">
                            {p.description || "Genuine replacement part — fitted and tested by our technicians."}
                          </p>
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 dark:border-slate-800 pt-3">
                            <p className="font-display font-bold text-lg text-gray-900 dark:text-white">{formatGhs(Number(p.sellingPrice))}</p>
                            <button
                              type="button"
                              disabled={outOfStock}
                              onClick={() => addPartToShopCart(p)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 dark:bg-brand-500 px-4 py-2 text-xs font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-50"
                            >
                              <ShoppingCart size={11} /> Add to cart
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Checkout */}
            <form onSubmit={submitOrder} className="mt-6 space-y-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              {cart.length > 0 && (
                <div className="rounded-xl bg-paper dark:bg-ink p-4 space-y-2">
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
                    <span className="text-brand-500">{formatGhs(totalPesewas)}</span>
                  </div>
                </div>
              )}

              {job.dropoff === "rider" && zones.length > 0 && (
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-slate-300">
                    <Motorbike size={12} className="text-brand-500" /> Shipping zone
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
{placing ? <Loader2 size={13} className="animate-spin" /> : <Phone size={12} />}
                {placing ? "Opening Paystack…" : cart.length === 0 ? "Add a part to continue" : `Pay ${formatGhs(totalPesewas)} now`}
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

            <div className="rounded-xl bg-paper dark:bg-ink p-4 mb-5 flex items-center justify-between">
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
                {balancePaying ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={12} />}
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
                      <span className="font-semibold">{formatGhs(o.totalPesewas)}</span>
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
                      <span className="font-semibold">{formatGhs(o.amountGhs)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">Questions about your repair? Call us on <span className="font-medium text-gray-600 dark:text-slate-300">024 438 8190</span></p>
          <Link href="/" className="inline-block rounded-full border border-gray-200 dark:border-slate-700 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-paper dark:hover:bg-slate-800 transition">
            Back to EazWorld
          </Link>
        </div>
      </div>
    </div>
  );
}