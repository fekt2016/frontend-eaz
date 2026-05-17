"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaStar } from "react-icons/fa";

export default function Testimonials() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/reviews")
      .then((r) => r.json())
      .then((json) => setReviews((json.data || []).slice(0, 4)))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-24 px-4 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Reviews</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white">
              What Our Clients Say
            </h2>
          </div>
          <Link href="/reviews" className="self-start md:self-auto text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition whitespace-nowrap">
            View all reviews →
          </Link>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-7 animate-pulse">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map((s) => <div key={s} className="w-3 h-3 rounded bg-gray-100 dark:bg-slate-700" />)}
                </div>
                <div className="space-y-2 mb-6">
                  <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded w-4/5" />
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-24 bg-gray-100 dark:bg-slate-700 rounded" />
                    <div className="h-2 w-16 bg-gray-100 dark:bg-slate-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 mb-10">
            <p className="text-gray-400 dark:text-slate-500 text-sm">No reviews yet — be the first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {reviews.map((t) => (
              <div key={t._id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-7">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map((s) => (
                    <FaStar key={s} size={13} className={s <= t.rating ? "text-amber-400" : "text-gray-200 dark:text-slate-700"} />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed mb-6">&ldquo;{t.review}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-semibold text-sm flex-shrink-0">
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-gray-400 dark:text-slate-500 text-xs">{t.service}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leave a Review CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Had a great experience?</p>
            <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5">Share your feedback — it helps others find us.</p>
          </div>
          <Link href="/reviews#leave-review" className="flex-shrink-0 px-6 py-2.5 rounded-full bg-gray-900 dark:bg-amber-500 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-amber-400 transition">
            Leave a Review ★
          </Link>
        </div>

      </div>
    </section>
  );
}
