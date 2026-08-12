"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { formatPhoneInput } from "@/lib/sanitize";
import { FaSpinner, FaCheckCircle, FaPhone, FaWrench } from "react-icons/fa";

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

  // Order form state
  const [activePartId, setActivePartId] = useState(null);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");

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

  const canOrder = job && ORDERABLE.includes(job.status) && (job.parts || []).length > 0;

  const openOrder = (part) => {
    setActivePartId(part.id);
    setQty(1);
    setOrderError("");
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    setOrderError("");
    if (!name.trim()) { setOrderError("Please enter your name."); return; }
    if (!phone.trim()) { setOrderError("Please enter the phone number on the receipt."); return; }
    setPlacing(true);
    try {
      const res = await api.post(`/track/${token}/part-orders`, {
        partLineId: activePartId,
        quantity: qty,
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
                          onClick={() => openOrder(part)}
                          className="mt-2 rounded-full bg-gray-900 dark:bg-brand-500 px-4 py-2 text-xs font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition"
                        >
                          Pay for part
                        </button>
                      )}
                    </div>
                  </div>

                  {activePartId === part.id && (
                    <form onSubmit={submitOrder} className="mt-5 space-y-4 rounded-xl bg-gray-50 dark:bg-slate-950 p-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Quantity</label>
                        <div className="flex items-center gap-3">
                          {[1, 2, 3].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setQty(n)}
                              className={`w-12 rounded-xl border py-2 text-sm font-semibold transition ${
                                qty === n
                                  ? "border-gray-900 bg-gray-900 text-white dark:border-brand-500 dark:bg-brand-500 dark:text-gray-900"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                          <span className="text-sm text-gray-400 dark:text-slate-500 ml-auto">
                            Total: <span className="font-semibold text-gray-900 dark:text-white">GH₵{part.priceGhs * qty}</span>
                          </span>
                        </div>
                      </div>
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
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setActivePartId(null)}
                          className="rounded-full border border-gray-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={placing}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 dark:bg-brand-500 py-2.5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-60"
                        >
                          {placing ? <FaSpinner size={13} className="animate-spin" /> : <FaPhone size={12} />}
                          {placing ? "Opening Paystack…" : "Continue to payment"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Part order history */}
        {(job.partOrders || []).length > 0 && (
          <div className="mt-8 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="px-6 pt-5">
              <h2 className="font-display font-bold text-lg">Part orders</h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Payments you&apos;ve made for this repair.</p>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-slate-800 mt-3">
              {job.partOrders.map((o) => {
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
        )}

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
