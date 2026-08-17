"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaClock, FaArrowLeft, FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp } from "react-icons/fa";

const CATEGORY_COLORS = {
  SEO:               "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  "Web Design":      "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
  "Case Study":      "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400",
  "Social Media":    "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
  Branding:          "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  "Phone Repair":    "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400",
  "Paid Advertising":"bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  "Email Marketing": "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
};

function renderContent(content) {
  const lines = content.trim().split("\n");
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="font-display font-bold text-2xl text-gray-900 dark:text-white mt-10 mb-4">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="font-semibold text-lg text-gray-900 dark:text-white mt-8 mb-3">{line.slice(4)}</h3>);
    } else if (line.startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) { items.push(lines[i].trim().slice(2)); i++; }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-2 mb-4">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-gray-600 dark:text-slate-400">
              <span className="text-brand-500 mt-1 flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-500 hover:underline">$1</a>') }} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\. /, "")); i++; }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-2 mb-4 list-decimal list-inside">
          {items.map((item, j) => (
            <li key={j} className="text-gray-600 dark:text-slate-400">
              <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-500 hover:underline">$1</a>') }} />
            </li>
          ))}
        </ol>
      );
      continue;
    } else {
      const html = line
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-500 hover:underline">$1</a>');
      elements.push(<p key={i} className="text-gray-600 dark:text-slate-400 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: html }} />);
    }
    i++;
  }
  return elements;
}

export default function BlogArticle({ slug }) {
  const [post, setPost]       = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
    fetch(`/api/v1/posts/${slug}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((json) => {
        setPost(json.data);
        // fetch related from same category
        return fetch("/api/v1/posts");
      })
      .then((r) => r.json())
      .then((json) => {
        const all = json.data || [];
        setRelated(all.filter((p) => p.slug !== slug).slice(0, 3));
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper dark:bg-ink flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) notFound();

  const date = post.publishedAt || post.createdAt;

  return (
    <div className="bg-paper dark:bg-ink text-gray-900 dark:text-white">
      {/* BACK */}
      <div className="px-4 pt-28 pb-4 max-w-4xl mx-auto">
        <Link href="/blog" className="inline-flex items-center gap-2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition text-sm">
          <FaArrowLeft size={11} /> Back to Blog
        </Link>
      </div>

      {/* HEADER */}
      <section className="px-4 pb-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[post.category] || "bg-gray-100 text-gray-600"}`}>
              {post.category}
            </span>
            <span className="text-gray-400 text-xs flex items-center gap-1">
              <FaClock size={10} /> {post.readTime}
            </span>
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-gray-900 dark:text-white leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-6">{post.excerpt}</p>
          <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30 flex items-center justify-center font-bold text-brand-500 text-sm">
                {post.author.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-gray-900 dark:text-white text-sm font-medium">{post.author}</p>
                {date && <p className="text-gray-400 dark:text-slate-500 text-xs">{new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 dark:text-slate-500 text-xs mr-1">Share:</span>
              {[
                { icon: FaFacebook,  href: `https://facebook.com/sharer/sharer.php?u=${shareUrl}` },
                { icon: FaTwitter,   href: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${encodeURIComponent(post.title)}` },
                { icon: FaLinkedin,  href: `https://linkedin.com/sharing/share-offsite/?url=${shareUrl}` },
                { icon: FaWhatsapp,  href: `https://wa.me/?text=${encodeURIComponent(post.title + " " + shareUrl)}` },
              ].map(({ icon: Icon, href }, idx) => (
                <a key={idx} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white hover:border-gray-400 transition">
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_220px] gap-10 items-start">
            <article>{renderContent(post.content)}</article>
            <aside className="space-y-5 lg:sticky lg:top-24">
              <div className="p-5 rounded-2xl bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800/30">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Need Help With {post.category}?</h3>
                <p className="text-gray-500 dark:text-slate-400 text-xs mb-3 leading-relaxed">Our team handles everything from strategy to execution.</p>
                <Link href="/book-consultation" className="block text-center py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-xs hover:bg-gray-700 transition">
                  Book a Free Consultation
                </Link>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Quick Links</h3>
                <div className="space-y-2">
                  {[["Our Services", "/services"], ["Portfolio", "/portfolio"], ["Book Consultation", "/book-consultation"], ["Contact Us", "/contact"]].map(([label, href]) => (
                    <Link key={href} href={href} className="block text-gray-500 dark:text-slate-400 text-xs hover:text-gray-900 dark:hover:text-white transition">
                      → {label}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="py-16 px-4 bg-paper dark:bg-ink border-y border-gray-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">More Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((p) => (
                <Link key={p._id} href={`/blog/${p.slug}`}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition group">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${CATEGORY_COLORS[p.category] || "bg-gray-100 text-gray-600"}`}>{p.category}</span>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug group-hover:text-brand-500 transition mb-2">{p.title}</h3>
                  <span className="text-gray-400 dark:text-slate-500 text-xs flex items-center gap-1"><FaClock size={10} /> {p.readTime}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">Want to Apply This to Your Business?</h3>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Book a free 30-minute consultation and we&apos;ll create a plan specifically for you.</p>
          <Link href="/book-consultation" className="px-6 py-3 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 font-semibold hover:bg-gray-700 dark:hover:bg-brand-400 transition text-sm">
            Book a Free Consultation →
          </Link>
        </div>
      </section>
    </div>
  );
}
