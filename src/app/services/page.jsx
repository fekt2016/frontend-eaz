import Link from "next/link";
import { FaCheckCircle, FaPalette, FaSearch, FaBullhorn, FaStar, FaHashtag, FaEnvelope, FaMobileAlt } from "react-icons/fa";
import ServicesGrid from "@/components/home/ServicesGrid";

const iconStrip = [
  { icon: FaPalette, label: "Web Design", accent: "#F5A623" },
  { icon: FaSearch, label: "SEO", accent: "#10b981" },
  { icon: FaBullhorn, label: "Paid Ads", accent: "#3b82f6" },
  { icon: FaStar, label: "Branding", accent: "#8b5cf6" },
  { icon: FaHashtag, label: "Social Media", accent: "#ec4899" },
  { icon: FaEnvelope, label: "Email", accent: "#f59e0b" },
  { icon: FaMobileAlt, label: "Phone Repair", accent: "#06b6d4" },
];

export const metadata = {
  title: "Our Digital Services | EazWorld",
  description: "Explore our 7 services: Web Design, SEO, Paid Ads, Branding, Social Media, Email Marketing, and Phone Repair in Accra, Ghana.",
  openGraph: {
    title: "Our Digital Services | EazWorld",
    description: "Web design, SEO, paid ads, branding, social media, email marketing, and phone repair — all from one team in Accra.",
    url: "https://eazworld.com/services",
    siteName: "EazWorld",
    type: "website",
  },
  alternates: {
    canonical: "https://eazworld.com/services",
  },
};

export default function ServicesPage() {
  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white">

      {/* HERO */}
      <section className="pt-28 pb-16 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">What We Offer</p>
          <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 dark:text-white mb-5">Our Services</h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-10">
            Six digital services and in-person phone repair — everything your business needs online, all from one trusted team in Accra.
          </p>

          {/* 7-icon strip */}
          <div className="flex flex-wrap justify-center gap-3">
            {iconStrip.map(({ icon: Icon, label, accent }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 min-w-[72px]"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${accent}18` }}
                >
                  <Icon size={16} style={{ color: accent }} />
                </div>
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES GRID — reuse homepage component */}
      <ServicesGrid />

      {/* SAIISAI FEATURED */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

          {/* Left: copy */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">All Services in Action</p>
            <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-4">
              See What&apos;s Possible When All 7 Work Together
            </h2>
            <p className="text-gray-500 dark:text-slate-400 leading-relaxed mb-6">
              Saiisai is our flagship project — a live marketplace built using every service we offer. The result: 150+ active sellers, thousands of daily transactions, and a brand that people recognise across Ghana.
            </p>

            {/* Stats row */}
            <div className="flex gap-8 mb-7">
              {[["150+", "Active sellers"], ["15k+", "Products listed"], ["4.7★", "Average rating"]].map(([val, lbl]) => (
                <div key={lbl}>
                  <p className="font-display font-bold text-2xl text-gray-900 dark:text-white">{val}</p>
                  <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5">{lbl}</p>
                </div>
              ))}
            </div>

            {/* Services checklist */}
            <ul className="space-y-2 mb-8">
              {["Web Design & Development", "Brand Identity", "SEO & Content", "Paid Advertising", "Social Media", "Email Marketing"].map((s) => (
                <li key={s} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-slate-300">
                  <FaCheckCircle size={13} className="text-amber-500 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>

            <Link
              href="/portfolio/saiisai"
              className="inline-flex px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition"
            >
              Read the Full Case Study →
            </Link>
          </div>

          {/* Right: CSS mock dashboard */}
          <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 p-5 space-y-3">
            {/* Mock browser bar */}
            <div className="flex items-center gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
              <span className="flex-1 ml-2 h-5 rounded bg-gray-100 dark:bg-slate-800 text-xs text-gray-400 dark:text-slate-500 flex items-center px-2">saiisai.com</span>
            </div>

            {/* Mock top stats */}
            <div className="grid grid-cols-3 gap-2">
              {[["150+", "Sellers", "#F5A623"], ["15k+", "Products", "#10b981"], ["4.7★", "Rating", "#3b82f6"]].map(([v, l, c]) => (
                <div key={l} className="rounded-xl p-3 text-center" style={{ background: `${c}10` }}>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{v}</p>
                  <p className="text-gray-400 dark:text-slate-500 text-xs">{l}</p>
                </div>
              ))}
            </div>

            {/* Mock product grid */}
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 overflow-hidden">
                  <div className="h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600" />
                  <div className="p-2">
                    <div className="h-2 rounded bg-gray-200 dark:bg-slate-700 mb-1" />
                    <div className="h-2 rounded bg-amber-100 dark:bg-amber-900/30 w-2/3" />
                  </div>
                </div>
              ))}
            </div>

            {/* Mock footer bar */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
              <div className="flex gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-6 w-12 rounded bg-gray-100 dark:bg-slate-800" />
                ))}
              </div>
              <div className="h-6 w-20 rounded-full bg-amber-400/30" />
            </div>
          </div>
        </div>
      </section>

      {/* HELP SECTION */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">Not Sure?</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white mb-4">
            Not Sure Which Services You Need?
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-2">We can help.</p>
          <p className="text-gray-400 dark:text-slate-500 mb-8 leading-relaxed">
            Every business is different. Book a free 30-minute consultation and we&apos;ll listen to your goals, then recommend exactly what makes sense — no pressure, no jargon.
          </p>
          <Link
            href="/book-consultation"
            className="inline-flex px-8 py-4 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition"
          >
            Schedule a Free Consultation
          </Link>
        </div>
      </section>

    </div>
  );
}
