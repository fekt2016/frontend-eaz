"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { statusBadge } from "@/lib/orderStatus";
import { useOrderTracking } from "@/hooks/queries/useTracking";

function fmtDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OrderTrackingDetailPage() {
  const { trackingNumber } = useParams();
  const { data: tracking, isLoading: loading, error } = useOrderTracking(trackingNumber);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 px-4 pt-28 pb-24">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/track-order"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <ArrowLeft size={11} /> Track another order
        </Link>

        <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mt-6 mb-2">Order Tracking</p>
        <h1 className="font-display font-black text-3xl md:text-4xl text-gray-900 dark:text-white mb-2">Tracking Details</h1>

        {loading && (
          <div className="mt-12 flex justify-center">
            <Loader2 size={22} className="animate-spin text-brand-500" />
          </div>
        )}

        {!loading && error && (
          <div className="mt-12 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-5 py-4 text-sm text-red-600 dark:text-red-400">
            {error.message || "Tracking number not found"}
          </div>
        )}

        {!loading && !error && tracking && (
          <div className="mt-6">
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-5">
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Tracking Number</p>
                  <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{tracking.trackingNumber}</p>
                  <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">Order Number</p>
                  <p className="font-display font-bold text-lg text-gray-900 dark:text-white">{tracking.orderNumber}</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">Placed {fmtDate(tracking.createdAt)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(tracking.status).classes}`}>
                  {statusBadge(tracking.status).label}
                </span>
              </div>

              {tracking.latestEvent && (
                <div className="mt-5 rounded-xl bg-gray-50 dark:bg-slate-950 p-4">
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Latest Update</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{tracking.latestEvent.status}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{fmtDate(tracking.latestEvent.timestamp)}</p>
                  </div>
                  {tracking.latestEvent.note && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{tracking.latestEvent.note}</p>
                  )}
                  {tracking.latestEvent.location && (
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500 inline-flex items-center gap-1">
                      <MapPin size={10} /> {tracking.latestEvent.location}
                    </p>
                  )}
                </div>
              )}

              {tracking.destination && (
                <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
                  Delivering to <span className="font-medium text-gray-900 dark:text-white">{tracking.destination}</span>
                </p>
              )}

              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4">Tracking History</p>
                {tracking.history.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-slate-500">No tracking updates yet — the order has been placed and is awaiting payment.</p>
                ) : (
                  <ol className="relative border-l border-gray-200 dark:border-slate-700 ml-2 space-y-6">
                    {tracking.history.map((h, i) => (
                      <li key={i} className="ml-6">
                        <span className="absolute -left-[9px] mt-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-brand-500" />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge(h.status).classes}`}>
                            {statusBadge(h.status).label}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-slate-500">{fmtDate(h.timestamp)}</span>
                        </div>
                        {h.note && <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{h.note}</p>}
                        {h.location && (
                          <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500 inline-flex items-center gap-1">
                            <MapPin size={10} /> {h.location}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/track-order"
                className="rounded-full border border-gray-200 dark:border-slate-700 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition"
              >
                Track another order
              </Link>
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