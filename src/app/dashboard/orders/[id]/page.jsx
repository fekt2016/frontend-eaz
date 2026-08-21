"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, PackageOpen, Send, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { sanitizeText } from "@/lib/sanitize";
import { formatGhs } from "@/lib/shop";
import { StatusBadge, fmtDate } from "@/components/dashboard/customer/CustomerCards";

const ORDER_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
// Reviews are only meaningful once a purchase is verified — mirrors the
// backend's own hasVerifiedPurchase gate (Order.status in paid|delivered),
// not a stricter "delivered only" guess.
const REVIEWABLE_ORDER_STATUSES = ["paid", "delivered"];

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
      setFormError(err.message || "Could not submit review.");
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
            <Star key={n} size={12} className={n <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-slate-600"} />
          ))}
        </div>
        {review.comment && <p className="text-gray-500 dark:text-slate-400 mt-1">{review.comment}</p>}
        {justSubmitted && <p className="text-green-600 dark:text-green-400 mt-1">Thanks for your review!</p>}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-brand-600 dark:text-brand-400 hover:underline mt-1"
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
            <Star size={16} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-slate-600"} />
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
      {formError && <p className="text-xs text-red-500">{formError}</p>}
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

  const load = () => {
    api
      .get(seesAll ? `/orders/${id}` : `/orders/mine/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err.message || "Order not found"))
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
      alert(err.message || "Update failed");
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
          <p className="text-gray-400 dark:text-slate-500 text-sm mb-2">Order not found.</p>
          <Link href="/dashboard/orders" className="text-sm text-brand-500 hover:underline inline-flex items-center gap-1.5">
            <ArrowLeft size={11} /> Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const zone = order.deliveryZone;
  const deliveryFee = zone?.fee != null ? zone.fee : order.deliveryFee;
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
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Placed {fmtDate(order.createdAt)}</p>
          {order.trackingNumber && (
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
              Tracking number{" "}
              <Link
                href={`/track/order/${order.trackingNumber}`}
                className="font-mono font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                {order.trackingNumber}
              </Link>
            </p>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>

      {seesAll && (
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
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
          <p className="text-sm text-gray-400 dark:text-slate-500">Tracking information is not available yet.</p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{history[history.length - 1].status}</p>
            {history[history.length - 1].note && (
              <p className="text-sm text-gray-600 dark:text-slate-300">{history[history.length - 1].note}</p>
            )}
            {history[history.length - 1].location && (
              <p className="text-xs text-gray-400 dark:text-slate-500 inline-flex items-center gap-1">
                <PackageOpen size={10} /> {history[history.length - 1].location}
              </p>
            )}
            <p className="text-xs text-gray-400 dark:text-slate-500">{fmtDate(history[history.length - 1].timestamp)}</p>
          </div>
        )}
        {order.trackingNumber && (
          <Link
            href={`/track/order/${order.trackingNumber}`}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            View full tracking details <ArrowRight size={10} />
          </Link>
        )}
      </div>

      {zone && (
        <div className="mb-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Delivery</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {zone.name} · {zone.estimatedDays} {zone.estimatedDays === 1 ? "day" : "days"} estimated
          </p>
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
                  <p className="text-xs text-gray-400 dark:text-slate-500">Qty {item.qty} × {formatGhs(item.price)}</p>
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
            <span className="text-gray-500 dark:text-slate-400">Delivery</span>
            <span className="font-medium text-gray-900 dark:text-white">{deliveryFee > 0 ? formatGhs(deliveryFee) : "—"}</span>
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