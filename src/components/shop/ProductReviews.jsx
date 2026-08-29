"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Star } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import {
  useProductReviews,
  useMyProductReview,
  useReviewEligibility,
  useSubmitProductReview,
  useUpdateProductReview,
} from "@/hooks/queries/useProductReviews";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating"),
  comment: z.string().min(10, "Please write at least 10 characters"),
});

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= rating ? "currentColor" : "none"}
          className={s <= rating ? "text-amber-400" : "text-gray-300 dark:text-slate-600"}
        />
      ))}
    </div>
  );
}

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none transition-transform hover:scale-110"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            size={26}
            fill={star <= (hovered || value) ? "currentColor" : "none"}
            className={
              star <= (hovered || value)
                ? "text-amber-400"
                : "text-gray-300 dark:text-slate-600"
            }
          />
        </button>
      ))}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 transition bg-white dark:bg-slate-800";

function ReviewForm({ productId, initial, mode, onDone }) {
  const [rating, setRating] = useState(initial?.rating || 0);
  const [comment, setComment] = useState(initial?.comment || "");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const submitReview = useSubmitProductReview(productId);
  const updateReview = useUpdateProductReview(productId);

  const isEditing = mode === "edit";
  const mutation = isEditing ? updateReview : submitReview;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = reviewSchema.safeParse({ rating, comment: comment.trim() });
    if (!result.success) {
      const errs = {};
      result.error.issues.forEach((i) => { errs[i.path[0]] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus("loading");
    mutation.mutate(
      { rating, comment: comment.trim() },
      {
        onSuccess: () => {
          setStatus("success");
          if (onDone) onDone();
        },
        onError: () => setStatus("error"),
      },
    );
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5 text-center">
        <Star size={20} className="mx-auto mb-2 text-emerald-500" fill="currentColor" />
        <p className="font-semibold text-gray-900 dark:text-white text-sm">
          {isEditing ? "Review updated" : "Thanks — review published"}
        </p>
        <p className="text-gray-500 dark:text-slate-400 text-xs mt-1">
          {isEditing ? "Your updated review is live." : "Your review is live on this product."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Your Rating <span className="text-red-500">*</span>
        </p>
        <StarInput value={rating} onChange={setRating} />
        {errors.rating && <p className="text-red-500 text-xs mt-1">{errors.rating}</p>}
      </div>

      <div>
        <textarea
          placeholder="What did you like or dislike about this product?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className={inputCls}
        />
        {errors.comment && <p className="text-red-500 text-xs mt-1">{errors.comment}</p>}
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-3 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 font-semibold hover:bg-gray-700 dark:hover:bg-brand-400 disabled:opacity-50 transition text-sm"
      >
        {mutation.isPending ? "Submitting..." : isEditing ? "Update Review →" : "Submit Review →"}
      </button>

      {status === "error" && (
        <p className="text-red-500 text-xs text-center">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}

export default function ProductReviews({ product }) {
  const { user, loading: authLoading } = useAuth();
  const [editing, setEditing] = useState(false);

  const productId = product?._id;
  const reviewsQ = useProductReviews(productId);
  const myReviewQ = useMyProductReview(productId, {
    enabled: !!productId && !authLoading && !!user,
  });
  // Only needed once we know the user has no existing review yet — avoids a
  // redundant purchase-verification query when they're just going to see
  // their own review anyway.
  const eligibilityQ = useReviewEligibility(productId, {
    enabled: !!productId && !authLoading && !!user && !myReviewQ.isLoading && !myReviewQ.data,
  });

  const reviews = reviewsQ.data?.data ?? [];
  const total = reviewsQ.data?.total ?? 0;
  const summary = product?.ratingSummary || { average: null, count: 0 };

  const myReview = myReviewQ.data ?? null;
  const checkingEligibility = !myReview && (myReviewQ.isLoading || eligibilityQ.isLoading);
  // Fail closed: if the eligibility check errors out (network issue, 500,
  // etc.) there's no confirmed verified purchase, so hide the form rather
  // than default to showing it. The backend re-verifies at submit time
  // regardless, but the UI shouldn't invite a submission it knows will 403.
  const canReview = eligibilityQ.data?.canReview ?? false;

  if (!productId) return null;

  return (
    <section className="mt-16 border-t border-gray-100 dark:border-slate-800 pt-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
            Customer Reviews
          </h2>
          <div className="flex items-center gap-2 mt-2">
            {summary.average !== null ? (
              <>
                <StarRating rating={Math.round(summary.average)} />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {summary.average}
                </span>
                <span className="text-xs text-gray-600 dark:text-slate-500">
                  · {summary.count} review{summary.count === 1 ? "" : "s"}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-600 dark:text-slate-500">No reviews yet</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Review list */}
        <div>
          {reviewsQ.isLoading ? (
            <div className="flex items-center gap-3 text-gray-600 text-sm py-8">
              <Loader2 size={16} className="animate-spin text-brand-500" /> Loading reviews…
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 px-6 py-12 text-center">
              <p className="text-3xl mb-3">
                <Star size={26} className="inline text-gray-300 dark:text-slate-600" />
              </p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                No reviews yet
              </p>
              <p className="text-gray-600 dark:text-slate-500 text-xs">
                Be the first to review this product.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div
                  key={r._id}
                  className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center font-display font-bold text-brand-ink dark:text-brand-400 text-xs flex-shrink-0">
                        {(r.userName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {r.userName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-slate-500">{fmtDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <StarRating rating={r.rating} size={13} />
                  </div>
                  <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                </div>
              ))}
              {total > reviews.length && (
                <p className="text-xs text-gray-600 dark:text-slate-500">
                  Showing first {reviews.length} of {total} reviews.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Form / prompt column */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            {authLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-600">
                <Loader2 size={18} className="animate-spin text-brand-500" />
              </div>
            ) : !user ? (
              <div className="text-center py-6">
                <Star size={24} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  Share your experience
                </p>
                <p className="text-gray-500 dark:text-slate-400 text-xs mb-5">
                  Log in to review this product — your review is tied to your account.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-block px-6 py-2.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-brand-400 transition"
                >
                  Log in to Review
                </Link>
              </div>
            ) : myReview && !editing ? (
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-3">
                  Your Review
                </h3>
                <div className="mb-4">
                  <StarRating rating={myReview.rating} />
                </div>
                <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-5">
                  &ldquo;{myReview.comment}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="w-full py-2.5 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition"
                >
                  Edit Review
                </button>
              </div>
            ) : editing ? (
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">
                  Edit Your Review
                </h3>
                <ReviewForm
                  productId={productId}
                  initial={myReview}
                  mode="edit"
                  onDone={() => setEditing(false)}
                />
              </div>
            ) : checkingEligibility ? (
              <div className="flex items-center justify-center py-10 text-gray-600">
                <Loader2 size={18} className="animate-spin text-brand-500" />
              </div>
            ) : !canReview ? (
              <div className="text-center py-6">
                <Star size={24} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  Verified purchasers only
                </p>
                <p className="text-gray-500 dark:text-slate-400 text-xs">
                  Reviews are limited to customers who&apos;ve bought this
                  product — once your order is paid and on its way, you&apos;ll
                  be able to leave a review here.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">
                  Write a Review
                </h3>
                <ReviewForm
                  productId={productId}
                  initial={null}
                  mode="create"
                  onDone={() => setEditing(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
