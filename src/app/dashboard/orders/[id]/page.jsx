"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, PackageOpen, Send, Star, RotateCcw, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, errorMessage } from "@/lib/api";
import { sanitizeText } from "@/lib/sanitize";
import { formatGhs, formatShippingMethod } from "@/lib/shop";
import PreorderProgress from "@/components/shop/PreorderProgress";
import { StatusBadge, fmtDate } from "@/components/dashboard/customer/CustomerCards";
import { Button } from "@/components/ui";

const ORDER_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
const REVIEWABLE_ORDER_STATUSES = ["delivered"];
// T15 — mirrors the backend's REFUND_ELIGIBLE_STATUSES exactly (orderController.js).
const REFUND_ELIGIBLE_STATUSES = ["paid", "processing", "shipped"];

/**
 * Review form/display for a single order line item. Fetches eligibility
 * once; renders nothing if the purchase isn't verified for this item
 * (`canReview` false and no existing review). Handles both first-time
 * submission (POST) and editing an existing review (PATCH .../reviews/mine).
 */
function OrderItemReview({ productId }) {
  const [status, setStatus] = useState("loading"); // loading | hidden | can-review | reviewed
  const [review, setReview] = useState(null);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    if (!productId) { setStatus("hidden"); return; }
    let cancelled = false;
    api.get(`/products/${productId}/reviews/eligibility`)
      .then((res) => {
        if (cancelled) return;
        const { canReview, alreadyReviewed } = res.data || {};
        if (alreadyReviewed) {
          return api.get(`/products/${productId}/reviews/mine`).then((r) => {
            if (cancelled) return;
            setReview(r.data);
            setRating(r.data?.rating || 5);
            setComment(r.data?.comment || "");
            setStatus("reviewed");
          });
        }
        setStatus(canReview ? "can-review" : "hidden");
      })
      .catch(() => { if (!cancelled) setStatus("hidden"); });
    return () => { cancelled = true; };
  }, [productId]);

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const cleanComment = sanitizeText(comment, 2000);
      if (review) {
        const res = await api.patch(`/products/${productId}/reviews/mine`, { rating, comment: cleanComment });
        setReview(res.data);
        setEditing(false);
      } else {
        const res = await api.post(`/products/${productId}/reviews`, { rating, comment: cleanComment });
        setReview(res.data);
        setStatus("reviewed");
        setJustSubmitted(true);
      }
    } catch (err) {
      setFormError(errorMessage(err, "Could not submit review."));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || status === "hidden") return null;

  if (status === "reviewed" && !editing) {
    return (
      <div className="mt-2 text-xs">
        <div className="flex items-center gap-0.5" aria-label={`Your rating: ${review.rating} out of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} size={12} className={n <= review.rating ? "fill-brand-500 text-brand-500 dark:fill-brand-400 dark:text-brand-400" : "text-gray-300 dark:text-slate-600"} />
          ))}
        </div>
        {review.comment && <p className="text-gray-500 dark:text-slate-400 mt-1">{review.comment}</p>}
        {justSubmitted && <p className="text-success dark:text-success-dark mt-1">Thanks for your review!</p>}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-brand-ink dark:text-brand-400 hover:underline mt-1"
        >
          Edit review
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-2">
      <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === rating}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => setRating(n)}
          >
            <Star size={16} className={n <= rating ? "fill-brand-500 text-brand-500 dark:fill-brand-400 dark:text-brand-400" : "text-gray-300 dark:text-slate-600"} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Share your experience with this product (min 10 characters)"
        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 resize-none"
      />
      {formError && <p className="text-xs text-error dark:text-error-dark" role="alert">{formError}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || comment.trim().length < 10}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-50"
        >
          {submitting ? "Saving…" : review ? "Save changes" : "Submit review"}
        </button>
        {review && (
          <button
            type="button"
            onClick={() => { setEditing(false); setRating(review.rating); setComment(review.comment || ""); setFormError(""); }}
            className="text-xs text-gray-500 dark:text-slate-400 hover:underline"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/**
 * Refund action + status — admin only (staff excluded, unlike the rest of
 * this page's order-management controls; refunds move real money and are
 * irreversible). Backend: POST /orders/:id/refund, POST /orders/:id/refund/sync.
 */
function RefundSection({ order, onUpdate }) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refund = order.refund || { status: "none" };

  const submitRefund = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post(`/orders/${order._id}/refund`, { reason: sanitizeText(reason, 500) });
      onUpdate(res.data);
      setConfirming(false);
      setReason("");
    } catch (err) {
      setError(errorMessage(err, "Refund failed."));
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post(`/orders/${order._id}/refund/sync`);
      onUpdate(res.data);
    } catch (err) {
      setError(errorMessage(err, "Failed to check refund status."));
    } finally {
      setLoading(false);
    }
  };

  // Nothing to show: never refunded, and the order isn't in a refundable state.
  if (refund.status === "none" && !REFUND_ELIGIBLE_STATUSES.includes(order.status)) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
      <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Refund</h2>

      {refund.status === "none" && (
        confirming ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Refund the full order total ({formatGhs(order.total)}) via Paystack? This cancels the order and cannot be undone.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Reason (optional, shown in the audit log)"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 resize-none"
            />
            {error && <p className="text-xs text-error dark:text-error-dark" role="alert">{error}</p>}
            <div className="flex items-center gap-3">
              <Button variant="danger" size="sm" onClick={submitRefund} loading={loading}>
                <RotateCcw size={10} aria-hidden="true" />
                {loading ? "Processing…" : "Confirm refund"}
              </Button>
              <button
                type="button"
                onClick={() => { setConfirming(false); setError(""); }}
                className="text-xs text-gray-500 dark:text-slate-400 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
            <RotateCcw size={10} aria-hidden="true" /> Refund this order
          </Button>
        )
      )}

      {refund.status === "processing" && (
        <div className="space-y-2">
          <p className="text-sm text-brand-ink dark:text-brand-400 font-medium">
            Refund in progress — {formatGhs(refund.amount || 0)}
          </p>
          <p className="text-xs text-gray-600 dark:text-slate-500">
            Requested {fmtDate(refund.requestedAt)}. Paystack refunds can take several days to settle.
          </p>
          {error && <p className="text-xs text-error dark:text-error-dark" role="alert">{error}</p>}
          <Button variant="secondary" size="sm" onClick={checkStatus} loading={loading}>
            <RefreshCw size={10} aria-hidden="true" />
            Check status now
          </Button>
        </div>
      )}

      {refund.status === "completed" && (
        <p className="text-sm text-success dark:text-success-dark font-medium">
          Refunded {formatGhs(refund.amount || 0)} on {fmtDate(refund.completedAt)}.
        </p>
      )}

      {refund.status === "failed" && (
        <div className="space-y-1.5">
          <p className="text-sm text-error dark:text-error-dark font-medium">Refund failed.</p>
          <Link href="/dashboard/activity-logs" className="text-xs text-brand-ink dark:text-brand-400 hover:underline">
            View details in the Activity Log
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CustomerOrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [trackStatus, setTrackStatus] = useState("processing");
  const [trackNote, setTrackNote] = useState("");
  const [trackLocation, setTrackLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const seesAll = ["admin", "superadmin", "staff"].includes(user?.role);
  const isAdmin = ["admin", "superadmin"].includes(user?.role); // refunds: admin only, staff excluded

  const load = () => {
    api
      .get(seesAll ? `/orders/${id}` : `/orders/mine/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(errorMessage(err, "Order not found")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, seesAll]);

  const handleTrackingUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/orders/${id}/tracking`, {
        status: trackStatus,
        note: trackNote,
        location: trackLocation,
      });
      setTrackNote("");
      setTrackLocation("");
      setOrder((prev) => ({ ...prev, status: trackStatus }));
      load();
    } catch (err) {
      alert(errorMessage(err, "Update failed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-20 flex justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 dark:border-slate-700 border-t-gray-900 dark:border-t-brand-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-20">
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
          <p className="text-gray-600 dark:text-slate-500 text-sm mb-2">Order not found.</p>
          <Link href="/dashboard/orders" className="text-sm text-brand-500 hover:underline inline-flex items-center gap-1.5">
            <ArrowLeft size={11} /> Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const zone = order.deliveryZone;
  const deliveryFee = order.shippingFee || zone?.fee || order.deliveryFee || 0;
  const history = order.trackingHistory || [];
  const statuses = [...ORDER_STATUSES];

  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 pb-20">
      <Link
        href="/dashboard/orders"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition"
      >
        <ArrowLeft size={11} /> Back to My Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">{order.orderNumber}</h1>
          <p className="text-sm text-gray-600 dark:text-slate-500 mt-0.5">Placed {fmtDate(order.createdAt)}</p>
          {order.trackingNumber && (
            <p className="text-sm text-gray-600 dark:text-slate-500 mt-1">
              Tracking number{" "}
              {/* Staff came here to work the order, so the number takes them to the
                  update form on this page. /track/order/… is the customer's
                  read-only view — following it dropped staff somewhere they could
                  not do anything. They can still reach it, deliberately, below. */}
              <Link
                href={seesAll ? "#tracking-update" : `/track/order/${order.trackingNumber}`}
                className="font-mono font-semibold text-brand-ink dark:text-brand-400 hover:underline"
              >
                {order.trackingNumber}
              </Link>
            </p>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      {seesAll && (
        <div
          id="tracking-update"
          className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6 scroll-mt-6"
        >
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Add tracking update</h2>
          <form onSubmit={handleTrackingUpdate} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Status</span>
                <select
                  value={trackStatus}
                  onChange={(e) => setTrackStatus(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Location (optional)</span>
                <input
                  type="text"
                  value={trackLocation}
                  onChange={(e) => setTrackLocation(e.target.value)}
                  placeholder="e.g. Accra depot"
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Note (optional)</span>
              <textarea
                value={trackNote}
                onChange={(e) => setTrackNote(e.target.value)}
                rows={2}
                placeholder="e.g. Handed to courier for delivery"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 resize-none"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-50"
            >
              <Send size={10} /> {saving ? "Saving…" : "Add tracking update"}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white">Shipping Status</h2>
          <StatusBadge status={order.status} />
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-slate-500">Tracking information is not available yet.</p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{history[history.length - 1].status}</p>
            {history[history.length - 1].note && (
              <p className="text-sm text-gray-600 dark:text-slate-300">{history[history.length - 1].note}</p>
            )}
            {history[history.length - 1].location && (
              <p className="text-xs text-gray-600 dark:text-slate-500 inline-flex items-center gap-1">
                <PackageOpen size={10} /> {history[history.length - 1].location}
              </p>
            )}
            <p className="text-xs text-gray-600 dark:text-slate-500">{fmtDate(history[history.length - 1].timestamp)}</p>
          </div>
        )}
        {order.trackingNumber && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {seesAll && (
              <Link
                href="#tracking-update"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink dark:text-brand-400 hover:underline"
              >
                Update tracking <ArrowRight size={10} />
              </Link>
            )}
            <Link
              href={`/track/order/${order.trackingNumber}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:underline"
            >
              {seesAll ? "View as customer" : "View full tracking details"} <ArrowRight size={10} />
            </Link>
          </div>
        )}
      </div>

      {isAdmin && <RefundSection order={order} onUpdate={setOrder} />}

      {(order.shippingMethod || zone) && (
        <div className="mb-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Delivery</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {order.shippingMethod
              ? formatShippingMethod(order)
              : zone?.name}
            {order.shippingZoneCode ? ` · ${order.shippingZoneCode}` : ""}
          </p>
          {deliveryFee > 0 && (
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{formatGhs(deliveryFee)}</p>
          )}
        </div>
      )}

      {/* Where a pre-ordered line actually is. Opening your own pre-order and
          seeing only a status and a price is the complaint this answers. */}
      {order.preorder && (
        <div className="mb-6">
          <PreorderProgress preorder={order.preorder} />
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Items</h2>
        <ul className="divide-y divide-gray-100 dark:divide-slate-800">
          {order.items?.map((item, i) => (
            <li key={item._id || i} className="py-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-600 dark:text-slate-500">Qty {item.qty} × {formatGhs(item.price)}</p>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white shrink-0">{formatGhs(item.price * item.qty)}</p>
              </div>
              {/* Reviews are the customer's own action on their own order —
                  never shown on the admin/staff view of someone else's order. */}
              {!seesAll && REVIEWABLE_ORDER_STATUSES.includes(order.status) && (
                <OrderItemReview productId={item.product || item.part} />
              )}
            </li>
          ))}
        </ul>
        <div className="border-t border-gray-100 dark:border-slate-800 mt-3 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-slate-400">Subtotal</span>
            <span className="font-medium text-gray-900 dark:text-white">{formatGhs(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-slate-400">
              {order.shippingMethod
                ? formatShippingMethod(order)
                : "Delivery"}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">{deliveryFee > 0 ? formatGhs(deliveryFee) : "Free"}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 dark:border-slate-800 pt-2 font-semibold">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-brand-500">{formatGhs(order.total)}</span>
          </div>
        </div>
      </div>

      {order.customer?.address && (
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Delivering to</h2>
          <p className="text-sm text-gray-700 dark:text-slate-300">{order.customer.name}</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">{order.customer.phone}</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">{order.customer.address}</p>
        </div>
      )}
    </div>
  );
}