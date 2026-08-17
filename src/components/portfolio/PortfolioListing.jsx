"use client";

import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { PROJECTS, CATEGORIES } from "@/data/portfolioData";
import { usePortfolioFilter } from "@/hooks/usePortfolio";

const CATEGORY_COLORS = {
  "E-commerce":   "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
  "Entertainment":"bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "Logistics":    "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Real Estate":  "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const stats = [
  { label: "Projects Delivered", value: "4" },
  { label: "Service Categories", value: "4" },
  { label: "Client Satisfaction", value: "100%" },
  { label: "Years Experience", value: "4yr" },
];

export default function PortfolioListing() {
  const { activeCategory, searchQuery, filteredProjects, setCategory, setSearch, resultCount } =
    usePortfolioFilter(PROJECTS);

  return (
    <div className="bg-paper dark:bg-ink text-gray-900 dark:text-white">

      {/* HERO */}
      <section className="pt-28 pb-16 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_auto] gap-10 items-start">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-4">Our Work</p>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-4 leading-tight">
              Projects That<br />Speak for Themselves.
            </h1>
            <p className="text-gray-500 dark:text-slate-400 text-lg mb-8 max-w-lg">
              Real projects, live on the web — built and managed by EazWorld for businesses across Ghana and beyond.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
                  <div className="font-display font-bold text-xl text-brand-500">{s.value}</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured stack preview */}
          <div className="hidden md:flex flex-col gap-3 min-w-[260px]">
            {PROJECTS.filter((p) => p.featured).slice(0, 3).map((project) => (
              <Link
                key={project.slug}
                href={`/portfolio/${project.slug}`}
                className="group flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition"
              >
                <Image
                  src={project.thumbnail}
                  alt={project.title}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs text-brand-500 font-medium truncate">{project.client}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-500 transition truncate">{project.title}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${CATEGORY_COLORS[project.category] || "bg-gray-100 text-gray-600"}`}>
                    {project.category}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STICKY FILTER + SEARCH */}
      <div className="sticky top-[64px] z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition border ${
                  activeCategory === cat
                    ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
                    : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-52">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 rounded-full border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-gray-400 transition bg-white dark:bg-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs"
                >
                  ×
                </button>
              )}
            </div>
            <p className="hidden sm:block text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">{resultCount} projects</p>
          </div>
        </div>
      </div>

      {/* PROJECTS GRID */}
      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-1">All Projects</p>
              <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Complete Portfolio</h2>
            </div>
            <p className="sm:hidden text-xs text-gray-400 dark:text-slate-500">{resultCount} projects</p>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-16 text-center">
              <Search size={24} className="mb-3 text-gray-400" />
              <p className="font-semibold text-gray-900 dark:text-white mb-2">No projects found</p>
              <p className="text-gray-400 dark:text-slate-500 text-sm mb-5 max-w-sm">Try a different category or search term.</p>
              <button
                type="button"
                onClick={() => { setCategory("All"); setSearch(""); }}
                className="rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project, index) => (
                <article
                  key={project.slug}
                  className={`group flex flex-col overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-md hover:-translate-y-1 transition duration-300 ${
                    index % 7 === 0 ? "lg:col-span-2" : ""
                  }`}
                >
                  <div className="relative overflow-hidden aspect-[16/10]">
                    <Image
                      src={project.thumbnail}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute left-3 top-3 flex gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[project.category] || "bg-white text-gray-700"}`}>
                        {project.category}
                      </span>
                      <span className="rounded-full bg-black/40 text-white px-2.5 py-0.5 text-xs">
                        {project.year}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-0.5">{project.client}</p>
                    <h3 className="font-display font-bold text-base text-gray-900 dark:text-white group-hover:text-brand-500 transition mb-1 line-clamp-2">{project.title}</h3>
                    <p className="text-gray-400 dark:text-slate-500 text-xs leading-relaxed line-clamp-3 mb-4 flex-1">{project.shortDesc}</p>
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-3">
                      <div>
                        {project.results?.[0] && (
                          <>
                            <p className="font-display font-bold text-sm text-gray-900 dark:text-white">{project.results[0].value}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">{project.results[0].label}</p>
                          </>
                        )}
                      </div>
                      <Link
                        href={`/portfolio/${project.slug}`}
                        className="rounded-full border border-gray-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-900 dark:hover:border-slate-400 hover:text-gray-900 dark:hover:text-white transition"
                      >
                        View case study →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">Have a Project in Mind?</h2>
          <p className="text-gray-400 mb-7">
            Join the businesses that trusted EazWorld to bring their vision to life.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact" className="rounded-full bg-brand-500 text-gray-900 font-semibold px-6 py-3 text-sm hover:bg-brand-400 transition">
              Start Your Project
            </Link>
            <Link href="/services" className="rounded-full border border-white/30 text-white px-6 py-3 text-sm font-medium hover:border-white hover:bg-white/10 transition">
              View Our Services
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
