"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { FaSearch, FaClock } from "react-icons/fa";

const CATEGORIES = ["All", "SEO", "Web Design", "Case Study", "Social Media", "Branding", "Phone Repair", "Paid Advertising", "Email Marketing", "General"];

const CATEGORY_COLORS = {
  SEO:               "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  "Web Design":      "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
  "Case Study":      "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400",
  "Social Media":    "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
  Branding:          "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  "Phone Repair":    "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400",
  "Paid Advertising":"bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  "Email Marketing": "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  General:           "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
};

function CategoryPill({ cat }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[cat] || CATEGORY_COLORS.General}`}>
      {cat}
    </span>
  );
}

function PostCard({ post }) {
  const date = post.publishedAt || post.createdAt;
  return (
    <article className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <CategoryPill cat={post.category} />
        <span className="text-gray-400 dark:text-slate-500 text-xs flex items-center gap-1">
          <FaClock size={10} /> {post.readTime}
        </span>
      </div>
      <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-brand-500 transition leading-snug">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed flex-1 mb-4">{post.excerpt}</p>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-slate-800">
        <div>
          <p className="text-gray-700 dark:text-slate-300 text-xs font-medium">{post.author}</p>
          {date && <p className="text-gray-400 dark:text-slate-500 text-xs">{new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>}
        </div>
        <Link href={`/blog/${post.slug}`} className="text-brand-500 text-xs font-medium hover:underline">
          Read →
        </Link>
      </div>
    </article>
  );
}

function PostCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-5 w-20 rounded-full bg-gray-100 dark:bg-slate-800" />
        <div className="h-4 w-16 rounded bg-gray-100 dark:bg-slate-800" />
      </div>
      <div className="h-5 w-4/5 rounded bg-gray-100 dark:bg-slate-800 mb-2" />
      <div className="h-4 w-full rounded bg-gray-100 dark:bg-slate-800 mb-1" />
      <div className="h-4 w-3/4 rounded bg-gray-100 dark:bg-slate-800 mb-4" />
      <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex justify-between">
        <div className="h-3 w-24 rounded bg-gray-100 dark:bg-slate-800" />
        <div className="h-3 w-12 rounded bg-gray-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export default function BlogListing() {
  const [posts, setPosts]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch]             = useState("");

  useEffect(() => {
    fetch("/api/v1/posts")
      .then((r) => r.json())
      .then((json) => setPosts(json.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const featured  = posts.find((p) => p.featured);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchCat    = activeCategory === "All" || p.category === activeCategory;
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch && !p.featured;
    });
  }, [posts, activeCategory, search]);

  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white">

      {/* HERO */}
      <section className="pt-28 pb-14 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-4">Insights & Guides</p>
          <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">The EazWorld Blog</h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
            Practical guides, case studies, and insights on digital marketing, web design, and growing your business in Ghana.
          </p>
        </div>
      </section>

      {/* FEATURED POST */}
      {!loading && featured && activeCategory === "All" && !search && (
        <section className="py-12 px-4 bg-gray-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="p-8 md:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 grid md:grid-cols-[1fr_auto] gap-8 items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-800/30">
                    Featured
                  </span>
                  <CategoryPill cat={featured.category} />
                </div>
                <h2 className="font-display font-bold text-2xl md:text-3xl text-gray-900 dark:text-white mb-3 hover:text-brand-500 transition">
                  <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
                </h2>
                <p className="text-gray-500 dark:text-slate-400 mb-4 leading-relaxed">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500 flex-wrap">
                  <span>{featured.author}</span>
                  <span>·</span>
                  {(featured.publishedAt || featured.createdAt) && (
                    <span>{new Date(featured.publishedAt || featured.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                  )}
                  <span>·</span>
                  <span className="flex items-center gap-1"><FaClock size={10} /> {featured.readTime}</span>
                </div>
              </div>
              <Link href={`/blog/${featured.slug}`}
                className="px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm whitespace-nowrap self-start">
                Read Article →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FILTER + SEARCH */}
      <section className="py-8 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                    activeCategory === cat
                      ? "bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900"
                      : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-56">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-xs" />
              <input
                type="text"
                placeholder="Search articles…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-brand-400 transition"
              />
            </div>
          </div>
        </div>
      </section>

      {/* POSTS GRID */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map((i) => <PostCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400 dark:text-slate-500">
              <p className="text-3xl mb-3">📭</p>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">No articles found</p>
              <p className="text-sm">Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800">
        <div className="max-w-2xl mx-auto text-center p-8 rounded-3xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h3 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">Want to Apply This to Your Business?</h3>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Book a free 30-minute consultation — honest advice tailored to your goals.</p>
          <Link href="/book-consultation"
            className="inline-block px-6 py-3 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 font-semibold hover:bg-gray-700 dark:hover:bg-brand-400 transition text-sm">
            Book a Free Consultation →
          </Link>
        </div>
      </section>

    </div>
  );
}
