import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";
import HeroCarousel from "@/components/home/HeroCarousel";
import ServicesGrid from "@/components/home/ServicesGrid";
import Testimonials from "@/components/home/Testimonials";
import CtaSection from "@/components/home/CtaSection";
import { posts } from "@/content/blog/posts";

export const metadata = {
  title: "EazWorld | Web Design, Hosting & Phone Repair in Accra, Ghana",
  description: "Ghana's premium digital agency. Web design, SEO, paid ads, branding, hosting, and phone repair in Accra.",
  openGraph: {
    title: "EazWorld | Digital Agency in Accra, Ghana",
    description: "Web design, SEO, paid ads, branding, hosting, and phone repair.",
    url: "https://eazworld.com",
    siteName: "EazWorld",
    type: "website",
  },
};

const CATEGORY_COLORS = {
  SEO: "bg-emerald-50 text-emerald-700",
  "Web Design": "bg-purple-50 text-purple-700",
  "Case Study": "bg-amber-50 text-amber-700",
  "Social Media": "bg-pink-50 text-pink-700",
  Branding: "bg-violet-50 text-violet-700",
  "Phone Repair": "bg-cyan-50 text-cyan-700",
};

export default function Home() {
  const recentPosts = posts.slice(0, 3);

  return (
    <>
      <HeroCarousel />
      <ServicesGrid />

      {/* SAIISAI FEATURED */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">Featured Work</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 mb-5 leading-tight">
              All 6 Services Working Together: Saiisai
            </h2>
            <p className="text-gray-500 leading-relaxed mb-6">
              Saiisai is Ghana&apos;s emerging online marketplace — built entirely by EazWorld from the ground up. We handled product strategy, UX design, development, branding, SEO, and growth marketing all in one project.
            </p>
            <ul className="space-y-2 mb-7">
              {["Web Design & Development", "Brand Identity", "SEO & Content Marketing", "Paid Advertising", "Social Media Management", "Email Marketing"].map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                  <FaCheckCircle size={13} className="text-amber-500 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-6 mb-8">
              {[["150+", "Sellers"], ["15k+", "Products"], ["4.7★", "Rating"], ["500+", "Daily Transactions"]].map(([val, label]) => (
                <div key={label}>
                  <p className="font-display font-bold text-2xl text-gray-900">{val}</p>
                  <p className="text-gray-400 text-xs">{label}</p>
                </div>
              ))}
            </div>
            <Link href="/portfolio/saiisai" className="inline-flex px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition">
              Read the Case Study →
            </Link>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-8 shadow-sm">
            <div className="space-y-4">
              {[
                { label: "Monthly Sellers", value: "150+", change: "+12 this month", positive: true },
                { label: "Products Listed", value: "15,400", change: "+340 this week", positive: true },
                { label: "Platform Rating", value: "4.7 / 5.0", change: "98 reviews", positive: true },
                { label: "Daily Transactions", value: "500+", change: "Peak day: 820", positive: true },
              ].map((metric) => (
                <div key={metric.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-xs text-gray-400">{metric.label}</p>
                    <p className="font-display font-bold text-xl text-gray-900">{metric.value}</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {metric.change}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-4 text-center">Live platform metrics</p>
          </div>
        </div>
      </section>

      <Testimonials />

      {/* BLOG PREVIEW */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">From the Blog</p>
              <h2 className="font-display font-bold text-3xl text-gray-900">Latest Insights</h2>
            </div>
            <Link href="/blog" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition hidden md:block">
              View all articles →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block p-6 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition"
              >
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-3 ${CATEGORY_COLORS[post.category] || "bg-gray-100 text-gray-600"}`}>
                  {post.category}
                </span>
                <h3 className="font-display font-bold text-gray-900 leading-snug mb-2 group-hover:text-amber-500 transition">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-xs">{post.readTime} · {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link href="/blog" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition">
              View all articles →
            </Link>
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
