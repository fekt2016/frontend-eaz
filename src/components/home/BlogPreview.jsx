"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

const CATEGORY_COLORS = {
  SEO:               "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Web Design":      "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "Case Study":      "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
  "Social Media":    "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  Branding:          "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Phone Repair":    "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Paid Advertising":"bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Email Marketing": "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

function Skeleton() {
  return (
    <div className="p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse">
      <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-slate-800 mb-3" />
      <div className="h-5 w-4/5 rounded bg-gray-100 dark:bg-slate-800 mb-2" />
      <div className="h-4 w-full rounded bg-gray-100 dark:bg-slate-800 mb-1" />
      <div className="h-3 w-24 rounded bg-gray-100 dark:bg-slate-800 mt-4" />
    </div>
  );
}

export default function BlogPreview() {
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/posts")
      .then((r) => r.json())
      .then((json) => setPosts((json.data || []).slice(0, 3)))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  // Don't render the section at all if no posts and not loading
  if (!loading && posts.length === 0) return null;

  return (
    <section className="py-24 px-4 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">From the Blog</p>
            <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white">Latest Insights</h2>
          </div>
          <Link href="/blog" className="text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition hidden md:block">
            View all articles →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading
            ? [1,2,3].map((i) => <Skeleton key={i} />)
            : posts.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug}`}
                className="group block p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition"
              >
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-3 ${CATEGORY_COLORS[post.category] || "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"}`}>
                  {post.category}
                </span>
                <h3 className="font-display font-bold text-gray-900 dark:text-white leading-snug mb-2 group-hover:text-brand-500 transition">
                  {post.title}
                </h3>
                <p className="text-gray-400 dark:text-slate-500 text-xs flex items-center gap-1.5">
                  <Clock size={9} /> {post.readTime}
                  {post.publishedAt && (
                    <> · {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</>
                  )}
                </p>
              </Link>
            ))
          }
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link href="/blog" className="text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition">
            View all articles →
          </Link>
        </div>
      </div>
    </section>
  );
}
