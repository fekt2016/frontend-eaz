import Link from "next/link";
import { FaCheckCircle, FaWhatsapp } from "react-icons/fa";
import HeroCarousel from "@/components/home/HeroCarousel";
import ServicesGrid from "@/components/home/ServicesGrid";
import ShopSection from "@/components/home/ShopSection";
import Testimonials from "@/components/home/Testimonials";
import BlogPreview from "@/components/home/BlogPreview";
import CtaSection from "@/components/home/CtaSection";

export const metadata = {
  title: "EazWorld | Web Design, SEO, Branding & Phone Repair in Accra, Ghana",
  description: "Ghana's trusted digital agency. Web design, SEO, paid ads, branding, social media, email marketing, hosting and phone repair in Accra.",
  keywords: ["web design Accra", "SEO Ghana", "digital marketing Ghana", "phone repair Accra", "web hosting Ghana"],
  openGraph: {
    title: "EazWorld | Digital Agency in Accra, Ghana",
    description: "Web design, SEO, paid ads, branding, hosting and phone repair — all from one team in Accra.",
    url: "https://eazworld.com",
    siteName: "EazWorld",
    type: "website",
  },
};

const stats = [
  { value: "4+",    label: "Years in Accra" },
  { value: "50+",   label: "Projects Delivered" },
  { value: "4.9★",  label: "Client Rating" },
  { value: "24hr",  label: "Response Time" },
];

const whyUs = [
  { icon: "🇬🇭", title: "Accra-Based Team",    desc: "We know the Ghanaian market, the culture, and what works locally." },
  { icon: "💰", title: "GHS Pricing",          desc: "All prices in cedis. Pay via Paystack, Mobile Money or bank transfer." },
  { icon: "🤝", title: "Honest Advice",        desc: "We tell you what you actually need — no unnecessary upsells." },
  { icon: "⚡", title: "Fast Delivery",         desc: "Most websites live within 2 weeks. Most repairs done same day." },
];

export default function Home() {
  return (
    <>
      <HeroCarousel />

      {/* STATS BAR */}
      <section className="py-10 px-4 bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="font-display font-black text-3xl text-amber-500">{value}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <ServicesGrid />

      {/* WHY EAZWORLD */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Why EazWorld</p>
            <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white">
              A Digital Partner You Can Trust
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map(({ icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
                <span className="text-3xl mb-4 block">{icon}</span>
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{title}</p>
                <p className="text-gray-400 dark:text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED WORK — SAIISAI */}
      <section className="py-24 px-4 bg-gray-50 dark:bg-slate-950">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">Featured Work</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white mb-5 leading-tight">
              All Services Working Together: Saiisai
            </h2>
            <p className="text-gray-500 dark:text-slate-400 leading-relaxed mb-6">
              Saiisai is Ghana&apos;s emerging online marketplace — built entirely by EazWorld from the ground up. We handled product strategy, UX design, development, branding, SEO, and growth marketing.
            </p>
            <ul className="space-y-2 mb-7">
              {["Web Design & Development", "Brand Identity", "SEO & Content Marketing", "Paid Advertising", "Social Media Management", "Email Marketing"].map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                  <FaCheckCircle size={13} className="text-amber-500 flex-shrink-0" /> {s}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-6 mb-8">
              {[["150+", "Sellers"], ["15k+", "Products"], ["4.7★", "Rating"], ["500+", "Daily Transactions"]].map(([val, label]) => (
                <div key={label}>
                  <p className="font-display font-bold text-2xl text-gray-900 dark:text-white">{val}</p>
                  <p className="text-gray-400 dark:text-slate-500 text-xs">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/portfolio/saiisai" className="px-6 py-3 rounded-full bg-gray-900 dark:bg-amber-500 text-white dark:text-gray-900 font-semibold text-sm hover:bg-gray-700 dark:hover:bg-amber-400 transition">
                Read the Case Study →
              </Link>
              <a href="https://wa.me/233244388190" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition">
                <FaWhatsapp /> Start a Project
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-8 shadow-sm">
            <div className="space-y-4">
              {[
                { label: "Monthly Sellers",    value: "150+",   change: "+12 this month" },
                { label: "Products Listed",     value: "15,400", change: "+340 this week" },
                { label: "Platform Rating",     value: "4.7 / 5.0", change: "98 reviews" },
                { label: "Daily Transactions",  value: "500+",   change: "Peak day: 820" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-slate-800 last:border-0">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{m.label}</p>
                    <p className="font-display font-bold text-xl text-gray-900 dark:text-white">{m.value}</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full">
                    {m.change}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-gray-400 dark:text-slate-500 text-xs mt-4 text-center">Live platform metrics</p>
          </div>
        </div>
      </section>

      <ShopSection />

      <Testimonials />
      <BlogPreview />
      <CtaSection />
    </>
  );
}
