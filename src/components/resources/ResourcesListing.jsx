"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { z } from "zod";
import {
  FileText, Table, Wrench, ClipboardList,
  Download, CheckCircle2, X,
} from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
});

const resources = [
  {
    id: "seo-checklist",
    type: "Checklist",
    title: "Complete SEO Checklist for Ghana Businesses",
    desc: "A step-by-step checklist covering technical SEO, on-page optimisation, and local search — specifically for Ghanaian businesses.",
    format: "PDF",
    pages: "8 pages",
    category: "SEO",
  },
  {
    id: "website-brief",
    type: "Template",
    title: "Website Project Brief Template",
    desc: "Capture all the information your developer needs before starting. Fill in this template to avoid costly scope changes.",
    format: "Google Doc",
    pages: "4 pages",
    category: "Web Design",
  },
  {
    id: "digital-marketing-guide",
    type: "Guide",
    title: "Digital Marketing Budget Guide",
    desc: "How to allocate your marketing budget across SEO, paid ads, social media, and email — with real benchmarks for Ghanaian SMEs.",
    format: "PDF",
    pages: "12 pages",
    category: "Marketing",
  },
  {
    id: "social-media-calendar",
    type: "Template",
    title: "Social Media Content Calendar",
    desc: "A 90-day content calendar template for Facebook and Instagram. Pre-built with post categories and scheduling tips.",
    format: "Excel / Google Sheets",
    pages: "3 tabs",
    category: "Social Media",
  },
  {
    id: "paid-ads-guide",
    type: "Guide",
    title: "Beginner's Guide to Google Ads in Ghana",
    desc: "Everything you need to run your first Google Ads campaign — from account setup to bidding strategy and tracking conversions.",
    format: "PDF",
    pages: "16 pages",
    category: "Paid Ads",
  },
  {
    id: "email-marketing-templates",
    type: "Template",
    title: "Email Marketing Starter Templates",
    desc: "5 ready-to-use email templates: Welcome email, promotional email, newsletter, abandoned cart, and re-engagement.",
    format: "Google Doc / HTML",
    pages: "5 templates",
    category: "Email",
  },
  {
    id: "branding-worksheet",
    type: "Checklist",
    title: "Brand Identity Worksheet",
    desc: "Define your brand voice, values, target audience, and visual style with this structured worksheet.",
    format: "PDF",
    pages: "6 pages",
    category: "Branding",
  },
  {
    id: "website-speed-guide",
    type: "Guide",
    title: "Website Speed Optimisation Guide",
    desc: "Why page speed matters and how to fix common issues — without a developer. Includes free tools for testing.",
    format: "PDF",
    pages: "10 pages",
    category: "Web Design",
  },
];

const TABS = ["All", "Guide", "Template", "Checklist"];

const TYPE_ICONS = {
  Guide: FileText,
  Template: Table,
  Checklist: ClipboardList,
  Tool: Wrench,
};

const TYPE_COLORS = {
  Guide: "bg-violet-50 text-violet-700 border-violet-100",
  Template: "bg-brand-50 text-brand-700 border-brand-100",
  Checklist: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Tool: "bg-cyan-50 text-cyan-700 border-cyan-100",
};

function DownloadModal({ resource, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = schema.safeParse({ name, email });
    if (!result.success) {
      const errs = {};
      result.error.issues.forEach((i) => { errs[i.path[0]] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus("loading");
    await new Promise((r) => setTimeout(r, 1000));
    setStatus("success");
  };

  const inputCls = "w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-gray-400 transition";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md p-8 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition">
          <X size={16} />
        </button>
        {status === "success" ? (
          <div className="text-center">
            <CheckCircle2 size={36} className="text-brand-500 mx-auto mb-4" />
            <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Check Your Inbox!</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
              We&apos;ve sent <strong className="text-gray-900 dark:text-white">{resource.title}</strong> to <strong className="text-brand-500">{email}</strong>.
            </p>
            <p className="text-gray-400 dark:text-slate-500 text-xs">Can&apos;t find it? Check your spam folder.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border mb-3 ${TYPE_COLORS[resource.type]}`}>
                {resource.type}
              </span>
              <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-1">{resource.title}</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm">{resource.format} · {resource.pages}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} ${errors.name ? "border-red-400" : ""}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} ${errors.email ? "border-red-400" : ""}`} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-700 disabled:opacity-50 transition text-sm flex items-center justify-center gap-2"
              >
                <Download size={14} />
                {status === "loading" ? "Sending..." : "Send to My Email"}
              </button>
              <p className="text-gray-400 dark:text-slate-500 text-xs text-center">Free, no spam. We&apos;ll send it straight to your inbox.</p>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function ResourcesListing() {
  const [activeTab, setActiveTab] = useState("All");
  const [selected, setSelected] = useState(null);

  const filtered = resources.filter((r) => activeTab === "All" || r.type === activeTab);

  return (
    <div className="bg-paper dark:bg-ink text-gray-900 dark:text-white">
      {/* HERO */}
      <section className="pt-28 pb-14 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-4">Free Resources</p>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">
            Free Guides, Templates & Tools
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Practical resources to help you grow your business online — checklists, guides, and templates used by our team and clients.
          </p>
        </div>
      </section>

      {/* TABS */}
      <section className="py-8 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto flex gap-2 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* GRID */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {filtered.map((resource) => {
                const Icon = TYPE_ICONS[resource.type] || FileText;
                return (
                  <div
                    key={resource.id}
                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${TYPE_COLORS[resource.type]}`}>
                        <Icon size={12} /> {resource.type}
                      </span>
                      <span className="text-gray-400 dark:text-slate-500 text-xs">{resource.format}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-2 flex-1">{resource.title}</h3>
                    <p className="text-gray-500 dark:text-slate-400 text-xs leading-relaxed mb-4">{resource.desc}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
                      <span className="text-gray-400 dark:text-slate-500 text-xs">{resource.pages}</span>
                      <button
                        type="button"
                        onClick={() => setSelected(resource)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition"
                      >
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="py-16 px-4 bg-paper dark:bg-ink border-t border-gray-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">Need More Than a Template?</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm">Let our team build and execute the strategy for you.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/contact" className="px-5 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm">
              Get a Free Quote
            </a>
            <a href="/book-consultation" className="px-5 py-3 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-paper dark:hover:bg-slate-800 transition text-sm">
              Book a Call
            </a>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selected && <DownloadModal resource={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
