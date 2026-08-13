"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FaSearch, FaClock } from "react-icons/fa";
import { posts, categories } from "@/content/blog/posts";

const CATEGORY_COLORS = {
  SEO: "bg-emerald-50 text-emerald-700",
  "Web Design": "bg-violet-50 text-violet-700",
  "Case Study": "bg-amber-50 text-amber-700",
  "Social Media": "bg-pink-50 text-pink-700",
  Branding: "bg-purple-50 text-purple-700",
  "Phone Repair": "bg-cyan-50 text-cyan-700",
};

function CategoryPill({ cat }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[cat] || "bg-gray-100 text-gray-600"}`}>
      {cat}
    </span>
  );
}

function PostCard({ post }) {
  return (
    <article className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <CategoryPill cat={post.category} />
        <span className="text-gray-400 text-xs flex items-center gap-1">
          <FaClock className="text-xs" /> {post.readTime}
        </span>
      </div>
      <h2 className="font-display font-bold text-lg text-gray-900 mb-2 group-hover:text-amber-500 transition leading-snug">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">{post.excerpt}</p>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <div>
          <p className="text-gray-700 text-xs font-medium">{post.author}</p>
          <p className="text-gray-400 text-xs">{new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <Link href={`/blog/${post.slug}`} className="text-amber-500 text-xs font-medium hover:underline">
          Read →
        </Link>
      </div>
    </article>
  );
}

export default function BlogListing() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const featured = posts.find((p) => p.featured);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch && !p.featured;
    });
  }, [activeCategory, search]);

  return (
    <div className="bg-white text-gray-900">
      {/* HERO */}
      <section className="pt-28 pb-14 px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">Insights & Guides</p>
          <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 mb-4">The EazWorld Blog</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Practical guides, case studies, and insights on digital marketing, web design, and growing your business in Ghana.</p>
        </div>
      </section>

      {/* FEATURED POST */}
      {featured && activeCategory === "All" && !search && (
        <section className="py-12 px-4 bg-gray-50 border-b border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="p-8 md:p-10 rounded-3xl bg-white border border-gray-100 grid md:grid-cols-[1fr_auto] gap-8 items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-medium text-amber-600">Featured</span>
                  <CategoryPill cat={featured.category} />
                </div>
                <h2 className="font-display font-bold text-2xl md:text-3xl text-gray-900 mb-3 hover:text-amber-500 transition">
                  <Link href={`/blog/${featured.slug}`}>{featured.title}</Link>
                </h2>
                <p className="text-gray-500 mb-4 leading-relaxed">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{featured.author}</span>
                  <span>·</span>
                  <span>{new Date(featured.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><FaClock /> {featured.readTime}</span>
                </div>
              </div>
              <Link
                href={`/blog/${featured.slug}`}
                className="px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm whitespace-nowrap self-start"
              >
                Read Article →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FILTER + SEARCH */}
      <section className="py-8 px-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                    activeCategory === cat
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-56">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-gray-400 transition"
              />
            </div>
          </div>
        </div>
      </section>

      {/* POSTS GRID */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No articles found. Try a different search or category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center p-8 rounded-3xl border border-gray-100 bg-white">
          <h3 className="font-display font-bold text-2xl text-gray-900 mb-2">Get Articles in Your Inbox</h3>
          <p className="text-gray-500 text-sm mb-6">New guides, case studies, and tips every week — no spam.</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-gray-400 transition"
            />
            <button type="submit" className="px-5 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
