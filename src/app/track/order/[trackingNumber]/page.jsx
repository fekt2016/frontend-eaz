"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, Package, Truck, Loader2, CheckCircle2 } from "lucide-react";
import { formatGhs } from "@/lib/shop";
import { statusBadge } from "@/lib/orderStatus";
import { useOrderTracking } from "@/hooks/queries/useTracking";
import PreorderProgress from "@/components/shop/PreorderProgress";

function fmtDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// T80 E2 — translate the backend's pickup lifecycle markers into the
// customer-facing copy. The order status itself is still "shipped" /
// "delivered" (we did not add new enum values), so we layer the marker
// on top to give the customer the right next-step prompt.
function pickupStageLabel(pickup, status) {
  if (!pickup) return null;
  if (pickup.pickedUpAt || status === "delivered") {
    return {
      key: "picked_up",
      label: "Picked Up",
      classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
      detail: `Collected ${fmtDate(pickup.pickedUpAt)}`,
    };
  }
  if (pickup.readyForPickupAt || status === "shipped") {
    return {
      key: "ready_for_pickup",
      label: "Ready for Pickup",
      classes: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
      detail: `Parcel arrived at pickup point ${fmtDate(pickup.readyForPickupAt)}`,
    };
  }
  if (status === "processing") {
    return {
      key: "packed",
      label: "Packed — heading to pickup point",
      classes: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
      detail: "Your parcel is packed and will be sent to the pickup point soon.",
    };
  }
  return null;
}

/**
 * The order's delivery events and its pre-order stages, as one journey.
 *
 * They now arrive as ONE array: the batch writes each stage it reaches into the
 * order's own tracking history (backend `syncPreorderJourney`), so the merge is
 * real data rather than a display trick — every page reading the history shows
 * the same journey, and so does anything exported from it.
 *
 * `preorderStage` is what distinguishes the two, and it is why the batch's
 * stages must not be re-read from `preorder.history` here: that would list each
 * stage twice, once from each source.
 */
function buildTimeline(tracking) {
  return (tracking?.history || [])
    .map((h) => ({
      kind: h.preorderStage ? "preorder" : "delivery",
      at: h.timestamp,
      status: h.status,
      // A stage entry's note IS its label ("Shipped"), so that reads as the
      // badge, and `detail` — what staff wrote for the customer — reads as the
      // line underneath, exactly where a courier note would sit.
      label: h.preorderStage ? h.note : "",
      note: h.preorderStage ? (h.detail || "") : h.note,
      location: h.location,
    }))
    .sort((a, b) => new Date(a.at) - new Date(b.at));
}

export default function OrderTrackingDetailPage() {
  const { trackingNumber } = useParams();
  const { data: tracking, isLoading: loading, error } = useOrderTracking(trackingNumber);

  const isPickupOrder = tracking?.shippingMethod === "bus_station_pickup";
  const stage = pickupStageLabel(tracking?.pickup, tracking?.status);
  // Both journeys as one list — see buildTimeline for why they arrive separately.
  const timeline = buildTimeline(tracking);

  return (
    <div className="min-h-screen bg-white dark:bg-ink text-gray-900 dark:text-slate-100 px-4 pt-28 pb-24">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/track-order"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <ArrowLeft size={11} /> Track another order
        </Link>

        <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mt-6 mb-2">Order Tracking</p>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white mb-2">Tracking Details</h1>

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
                  <p className="text-xs text-gray-600 dark:text-slate-500">Tracking Number</p>
                  <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{tracking.trackingNumber}</p>
                  <p className="mt-2 text-xs text-gray-600 dark:text-slate-500">Order Number</p>
                  <p className="font-display font-bold text-lg text-gray-900 dark:text-white">{tracking.orderNumber}</p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-slate-500">Placed {fmtDate(tracking.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(tracking.status).classes}`}>
                    {statusBadge(tracking.status).label}
                  </span>
                  {isPickupOrder && stage && (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stage.classes}`}>
                      {stage.label}
                    </span>
                  )}
                </div>
              </div>

              {/* T45: a pre-ordered item's journey, shown above the order's own
                  timeline because "where is my phone" is the question that
                  brought the customer here. Null for an ordinary order. */}
              <PreorderProgress preorder={tracking.preorder} />

              {/* T80 E2 — Pickup panel. Shown when the order's shippingMethod
                  is bus_station_pickup. The panel names the pickup station,
                  the region, and the current pickup-stage detail. */}
              {isPickupOrder && tracking.pickup && (
                <div className="mt-5 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Package size={16} className="mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <div className="flex-1 text-sm">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1.5">
                        Pickup Station
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {tracking.pickup.name || "Pickup station"}
                      </p>
                      {tracking.pickup.region && (
                        <p className="text-gray-600 dark:text-slate-400 mt-0.5">
                          {tracking.pickup.region}
                        </p>
                      )}
                      {stage?.detail && (
                        <p className="text-gray-700 dark:text-slate-300 mt-2">
                          {stage.detail}
                        </p>
                      )}
                      {stage?.key === "ready_for_pickup" && (
                        <p className="mt-2 text-xs text-gray-600 dark:text-slate-400 inline-flex items-center gap-1">
                          <CheckCircle2 size={11} /> Bring a valid ID when collecting.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping details — method, speed, fee, neighborhood. Hidden
                  for pickup orders (the pickup panel above carries the same
                  information in pickup form). */}
              {!isPickupOrder && (tracking.shippingMethod || tracking.shippingNeighborhood || tracking.shippingZoneName) && (
                <div className="mt-5 rounded-xl bg-paper dark:bg-ink p-4">
                  <p className="text-xs font-semibold text-gray-600 dark:text-slate-500 uppercase tracking-wider mb-2">Delivery Details</p>
                  <div className="flex items-start gap-3">
                    <Truck size={16} className="mt-0.5 text-brand-500 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {tracking.shippingMethod === "courier_dispatch" ? "Courier Delivery" : "In-House Delivery"}
                        {tracking.shippingSpeed && tracking.shippingSpeed !== "standard" ? ` — ${tracking.shippingSpeed.replace("_", " ")}` : ""}
                      </p>
                      {tracking.shippingNeighborhood && (
                        <p className="text-gray-600 dark:text-slate-400 mt-0.5">
                          {tracking.shippingNeighborhood}{tracking.shippingZoneName ? ` · ${tracking.shippingZoneName}` : ""}
                        </p>
                      )}
                      <p className="text-gray-600 dark:text-slate-400 mt-0.5">
                        {tracking.shippingFee > 0 ? `Shipping: ${formatGhs(tracking.shippingFee)}` : "Free delivery"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {tracking.latestEvent && (
                <div className="mt-5 rounded-xl bg-paper dark:bg-ink p-4">
                  <p className="text-xs font-semibold text-gray-600 dark:text-slate-500 uppercase tracking-wider mb-1">Latest Update</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{tracking.latestEvent.status}</p>
                    <p className="text-xs text-gray-600 dark:text-slate-500">{fmtDate(tracking.latestEvent.timestamp)}</p>
                  </div>
                  {tracking.latestEvent.note && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{tracking.latestEvent.note}</p>
                  )}
                  {tracking.latestEvent.location && (
                    <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-500 inline-flex items-center gap-1">
                      <MapPin size={10} /> {tracking.latestEvent.location}
                    </p>
                  )}
                </div>
              )}

              {tracking.destination && !isPickupOrder && (
                <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
                  Delivering to <span className="font-medium text-gray-900 dark:text-white">{tracking.destination}</span>
                </p>
              )}

              <div className="mt-6">
                <p className="text-xs font-semibold text-gray-600 dark:text-slate-500 uppercase tracking-wider mb-4">Tracking History</p>
                {timeline.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-slate-500">
                    {tracking.preorder
                      ? "No movement to report yet — your pre-order is confirmed and we'll log each stage here as it happens."
                      : "No tracking updates yet — the order has been placed and is awaiting payment."}
                  </p>
                ) : (
                  <ol className="relative border-l border-gray-200 dark:border-slate-700 ml-2 space-y-6">
                    {timeline.map((h, i) => (
                      <li key={i} className="ml-6">
                        <span
                          className={`absolute -left-[9px] mt-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                            h.kind === "preorder" ? "bg-blue-500" : "bg-brand-500"
                          }`}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {h.kind === "preorder" ? (
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                              {h.label}
                            </span>
                          ) : (
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge(h.status).classes}`}>
                              {statusBadge(h.status).label}
                            </span>
                          )}
                          <span className="text-xs text-gray-600 dark:text-slate-500">{fmtDate(h.at)}</span>
                        </div>
                        {h.note && <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{h.note}</p>}
                        {h.location && (
                          <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-500 inline-flex items-center gap-1">
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
