"use client";

import { useEffect, useState } from "react";
import ReviewForm from "@/components/ReviewForm";
import { FaStar } from "react-icons/fa";
import Link from "next/link";

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FaStar key={s} size={13} className={s <= rating ? "text-amber-400" : "text-gray-200 dark:text-slate-700"} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/v1/reviews");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setReviews(json.data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white">

      {/* HERO */}
      <section className="pt-28 pb-14 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">Client Reviews</p>
          <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">What Our Clients Say</h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg">Real feedback from real customers. We&apos;re proud of every project we deliver.</p>
        </div>
      </section>

      {/* STATS */}
      <section className="py-10 px-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[[avgRating, "Average Rating"], ["100%", "Client Satisfaction"], ["4+", "Years in Accra"]].map(([val, label]) => (
            <div key={label}>
              <p className="font-display font-black text-3xl text-amber-500">{val}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS + FORM */}
      <section className="py-20 px-4" id="leave-review">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_380px] gap-12">

          {/* Reviews list */}
          <div>
            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-8">
              Recent Reviews
              {reviews.length > 0 && (
                <span className="ml-3 text-sm font-normal text-gray-400 dark:text-slate-500">({reviews.length})</span>
              )}
            </h2>

            {loading ? (
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-24 bg-gray-100 dark:bg-slate-800 rounded" />
                        <div className="h-2 w-16 bg-gray-100 dark:bg-slate-800 rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-full" />
                      <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-16 text-center">
                <p className="text-3xl mb-3">⭐</p>
                <p className="font-semibold text-gray-900 dark:text-white mb-2">No reviews yet</p>
                <p className="text-gray-400 dark:text-slate-500 text-sm">Be the first to share your experience with EazWorld.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {reviews.map((r) => (
                  <div key={r._id} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center font-display font-bold text-amber-600 dark:text-amber-400 text-sm flex-shrink-0">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.name}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">{r.service}</p>
                        </div>
                      </div>
                      <StarRating rating={r.rating} />
                    </div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">&ldquo;{r.review}&rdquo;</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review form */}
          <div>
            <div className="sticky top-24">
              <div className="p-7 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-1">Leave a Review</h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Had a great experience? We&apos;d love to hear from you.</p>
                <ReviewForm onSuccess={fetchReviews} />
              </div>
              <div className="mt-4 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-3">Want to work with us?</p>
                <Link href="/book-consultation" className="block py-2.5 rounded-full bg-gray-900 dark:bg-amber-500 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-amber-400 transition">
                  Book a Free Consultation
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
