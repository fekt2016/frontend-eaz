import Link from "next/link";
import { FaCheckCircle, FaWhatsapp } from "react-icons/fa";

export const metadata = {
  title: "Paid Advertising Pricing | EazWorld",
  description: "Facebook, Instagram and Google Ads management for businesses in Accra, Ghana. Transparent pricing with no hidden fees.",
};

const packages = [
  {
    name: "Ads Starter",
    price: "GHS 800",
    priceRange: "GHS 800/mo",
    period: "monthly",
    desc: "For small businesses and startups running their first paid campaigns on Facebook or Instagram.",
    color: "border-gray-100 dark:border-slate-800",
    badge: null,
    features: [
      "1 platform (Facebook or Instagram)",
      "Up to 2 active ad campaigns",
      "Ad creative design (2 per month)",
      "Audience targeting setup",
      "Monthly performance report",
      "Budget: client manages own ad spend",
      "WhatsApp support",
    ],
    note: "Best for: small shops, event promoters, local services",
  },
  {
    name: "Ads Business",
    price: "GHS 2,000",
    priceRange: "GHS 2,000/mo",
    period: "monthly",
    desc: "For SMEs and growing businesses who want serious results from Facebook, Instagram and Google Ads.",
    color: "border-brand-400 dark:border-brand-500",
    badge: "Most Popular",
    features: [
      "2 platforms (Facebook + Instagram or Google)",
      "Up to 5 active ad campaigns",
      "Ad creative design (4 per month)",
      "A/B split testing",
      "Pixel / conversion tracking setup",
      "Retargeting campaigns",
      "Competitor ad analysis",
      "Bi-weekly performance report",
      "Monthly strategy call",
      "Priority WhatsApp support",
    ],
    note: "Best for: e-commerce, clinics, schools, logistics, real estate",
  },
];

const addons = [
  { name: "Ad Account Setup", price: "GHS 400", desc: "Full setup of your Facebook Business Manager, Pixel and Google Ads account." },
  { name: "Ad Creative Pack", price: "GHS 300 – 600", desc: "5 professional ad creatives (images or short videos) designed for your campaign." },
  { name: "Landing Page for Ads", price: "GHS 600 – 1,200", desc: "A dedicated high-converting landing page built specifically for your ad campaign." },
  { name: "Google Ads Setup", price: "GHS 500", desc: "One-time keyword research, campaign structure and ad copywriting for Google Search." },
  { name: "Retargeting Setup", price: "GHS 400", desc: "Pixel installation and retargeting audience creation to win back website visitors." },
  { name: "Ad Audit", price: "GHS 350", desc: "Review of your existing campaigns with a clear report on what to fix and improve." },
];

const faqs = [
  { q: "Does your fee include the ad spend?", a: "No. Our fee covers campaign management and strategy only. You control and pay your own ad budget directly to Facebook or Google." },
  { q: "How much should I budget for ad spend?", a: "We recommend a minimum of GHS 500–1,000/month in ad spend for meaningful results. The more consistent the spend, the faster we can optimise." },
  { q: "Which platforms do you manage?", a: "Facebook, Instagram and Google Ads. We'll recommend the best platform based on your business and target audience." },
  { q: "How long before I see results?", a: "Most campaigns need 2–4 weeks to gather enough data for optimisation. Month 2 and 3 typically show significantly better results as we refine audiences and creatives." },
  { q: "Do you design the ads?", a: "Yes. Every plan includes ad creative design. We create images and copy tailored to your brand and campaign goal." },
  { q: "Is there a minimum contract?", a: "We recommend a minimum of 2 months to see proper results. Month-to-month is available, but paid ads reward consistency." },
  { q: "Can you manage ads for diaspora clients?", a: "Yes. We work with Ghanaian diaspora clients globally and can manage campaigns targeting audiences in Ghana or internationally." },
];

export default function PaidAdsPage() {
  return (
    <div className="bg-paper dark:bg-ink text-gray-900 dark:text-white">

      {/* HERO */}
      <section className="pt-28 pb-16 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-4">Paid Advertising</p>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">
            Ads That Bring<br />Real Customers.
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-8">
            Facebook, Instagram and Google Ads managed for you — targeted, trackable and built around your budget.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/book-consultation" className="px-6 py-3 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-brand-400 transition">
              Book Free Consultation
            </Link>
            <a href="https://wa.me/233244388190" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition">
              <FaWhatsapp /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* CAPACITY NOTICE */}
      <section className="py-5 px-4 bg-brand-50 dark:bg-brand-900/10 border-b border-brand-100 dark:border-brand-800/30">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-3 text-center flex-wrap">
          <span className="text-brand-500 text-base">⚡</span>
          <p className="text-sm text-brand-700 dark:text-brand-400 font-medium">
            We&apos;re currently taking a limited number of ads clients to ensure quality.{" "}
            <Link href="/book-consultation" className="underline underline-offset-2 hover:no-underline">Book early to secure your slot.</Link>
          </p>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-3">Monthly Plans</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-3">Choose Your Plan</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-12">Management fee only — ad spend is paid separately by you directly to the platform.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {packages.map((pkg) => (
              <div key={pkg.name} className={`relative flex flex-col p-6 rounded-2xl border-2 bg-white dark:bg-slate-900 ${pkg.color}`}>
                {pkg.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap bg-brand-500 text-white">
                    {pkg.badge}
                  </span>
                )}
                <div className="mb-5">
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-1">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-brand-500">{pkg.price}<span className="text-sm font-normal text-gray-400 dark:text-slate-500"> / month</span></p>
                </div>
                <p className="text-gray-500 dark:text-slate-400 text-xs leading-relaxed mb-5">{pkg.desc}</p>
                <ul className="space-y-2 mb-5 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-700 dark:text-slate-300">
                      <FaCheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={11} />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 italic mb-5">{pkg.note}</p>
                <Link href="/book-consultation"
                  className={`block text-center py-2.5 rounded-full text-sm font-semibold transition ${
                    pkg.badge === "Most Popular"
                      ? "bg-brand-500 text-white hover:bg-brand-400"
                      : "border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500"
                  }`}>
                  Get Started →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADD-ONS */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-3">Add-ons</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-10">Optional Extras</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {addons.map((a) => (
              <div key={a.name} className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-ink">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{a.name}</p>
                  <span className="text-brand-500 font-bold text-sm whitespace-nowrap ml-2">{a.price}</span>
                </div>
                <p className="text-gray-400 dark:text-slate-500 text-xs leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-3">FAQ</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-8">Common Questions</h2>
          <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
            {faqs.map((faq) => (
              <div key={faq.q} className="p-6 bg-white dark:bg-slate-900">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{faq.q}</p>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gray-900 dark:bg-slate-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">Ready to Run Ads That Actually Work?</h2>
          <p className="text-gray-400 mb-7 text-sm">Book a free consultation. We&apos;ll review your business, recommend a strategy, and give you a realistic expectation of results.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/book-consultation" className="rounded-full bg-brand-500 text-gray-900 font-semibold px-6 py-3 text-sm hover:bg-brand-400 transition">
              Book Free Consultation
            </Link>
            <a href="https://wa.me/233244388190" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-emerald-600 text-white px-6 py-3 text-sm font-semibold hover:bg-emerald-700 transition">
              <FaWhatsapp /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
