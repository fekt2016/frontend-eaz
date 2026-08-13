"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { FaClock, FaArrowLeft, FaFacebook, FaTwitter, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { posts } from "@/content/blog/posts";

const CATEGORY_COLORS = {
  SEO: "bg-emerald-50 text-emerald-700",
  "Web Design": "bg-violet-50 text-violet-700",
  "Case Study": "bg-amber-50 text-amber-700",
  "Social Media": "bg-pink-50 text-pink-700",
  Branding: "bg-purple-50 text-purple-700",
  "Phone Repair": "bg-cyan-50 text-cyan-700",
};

function renderContent(content) {
  const lines = content.trim().split("\n");
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="font-display font-bold text-2xl text-gray-900 mt-10 mb-4">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="font-semibold text-lg text-gray-900 mt-8 mb-3">{line.slice(4)}</h3>);
    } else if (line.startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-2 mb-4">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-gray-600">
              <span className="text-amber-500 mt-1 flex-shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: item.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-amber-500 hover:underline">$1</a>') }} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-2 mb-4 list-decimal list-inside">
          {items.map((item, j) => (
            <li key={j} className="text-gray-600">
              <span dangerouslySetInnerHTML={{ __html: item.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-amber-500 hover:underline">$1</a>') }} />
            </li>
          ))}
        </ol>
      );
      continue;
    } else {
      const html = line
        .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-gray-900 font-semibold">$1</strong>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-amber-500 hover:underline">$1</a>');
      elements.push(<p key={i} className="text-gray-600 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: html }} />);
    }
    i++;
  }
  return elements;
}

export default function BlogArticle({ slug }) {
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = posts.filter((p) => p.id !== post.id && (p.category === post.category || p.featured)).slice(0, 3);
  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://eazworld.com/blog/${slug}`;

  return (
    <div className="bg-white text-gray-900">
      {/* BACK */}
      <div className="px-4 pt-28 pb-4 max-w-4xl mx-auto">
        <Link href="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 transition text-sm">
          <FaArrowLeft className="text-xs" /> Back to Blog
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
              <FaClock className="text-xs" /> {post.readTime}
            </span>
          </div>
          <h1 className="font-display font-black text-3xl md:text-4xl lg:text-5xl text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-gray-500 text-lg mb-6">{post.excerpt}</p>
          <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center font-bold text-amber-500 text-sm">
                {post.author.split(" ").map(w => w[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-gray-900 text-sm font-medium">{post.author}</p>
                <p className="text-gray-400 text-xs">{new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs mr-1">Share:</span>
              {[
                { icon: FaFacebook, href: `https://facebook.com/sharer/sharer.php?u=${shareUrl}`, label: "Facebook" },
                { icon: FaTwitter, href: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${post.title}`, label: "Twitter" },
                { icon: FaLinkedin, href: `https://linkedin.com/sharing/share-offsite/?url=${shareUrl}`, label: "LinkedIn" },
                { icon: FaWhatsapp, href: `https://wa.me/?text=${post.title}%20${shareUrl}`, label: "WhatsApp" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-400 transition"
                >
                  <Icon size={14} />
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
            <article className="max-w-none">
              {renderContent(post.content)}
            </article>

            <aside className="space-y-5 lg:sticky lg:top-24">
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">Need Help With {post.category}?</h3>
                <p className="text-gray-500 text-xs mb-3 leading-relaxed">Our team handles everything from strategy to execution.</p>
                <Link href="/contact" className="block text-center py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-xs hover:bg-gray-700 transition">
                  Get a Free Quote
                </Link>
              </div>

              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Quick Links</h3>
                <div className="space-y-2">
                  {[
                    { label: "Our Services", href: "/services" },
                    { label: "Portfolio", href: "/portfolio" },
                    { label: "Book Consultation", href: "/book-consultation" },
                    { label: "Contact Us", href: "/contact" },
                  ].map((l) => (
                    <Link key={l.href} href={l.href} className="block text-gray-500 text-xs hover:text-gray-900 transition">
                      → {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* RELATED POSTS */}
      {related.length > 0 && (
        <section className="py-16 px-4 bg-gray-50 border-y border-gray-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display font-bold text-2xl text-gray-900 mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="p-5 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition group"
                >
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${CATEGORY_COLORS[p.category] || "bg-gray-100 text-gray-600"}`}>
                    {p.category}
                  </span>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-amber-500 transition mb-2">{p.title}</h3>
                  <span className="text-gray-400 text-xs flex items-center gap-1"><FaClock /> {p.readTime}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="font-display font-bold text-2xl text-gray-900 mb-2">Want to Apply This to Your Business?</h3>
          <p className="text-gray-500 text-sm mb-6">Book a free 30-minute consultation and we&apos;ll create a plan specifically for you.</p>
          <Link href="/book-consultation" className="px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm">
            Book a Free Consultation
          </Link>
        </div>
      </section>
    </div>
  );
}
