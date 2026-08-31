import Link from "next/link";
import { CheckCircle2, Zap } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export const metadata = {
  // T104 — no brand here: the root layout's title.template appends "| EazWorld".
  title: "SEO & Content Marketing Pricing",
  description: "Transparent SEO and content marketing pricing for businesses in Accra, Ghana. Local SEO, business SEO, content writing and one-time audits.",
};

const packages = [
  {
    name: "Local SEO",
    price: "GHS 800",
    priceRange: "GHS 800/mo",
    period: "monthly",
    desc: "For shops, salons, churches, and local service businesses who need to show up on Google Maps and local search.",
    color: "border-gray-100 dark:border-slate-800",
    badge: null,
    features: [
      "Google My Business setup & optimisation",
      "2 blog posts or web copy pieces/month",
      "10 keyword tracking",
      "On-page SEO for up to 5 pages",
      "Google Search Console setup",
      "Monthly performance report",
      "WhatsApp support",
    ],
    note: "Best for: restaurants, clinics, salons, churches, retail shops",
  },
  {
    name: "Business SEO",
    price: "GHS 2,000",
    priceRange: "GHS 2,000/mo",
    period: "monthly",
    desc: "For SMEs, law firms, logistics companies and clinics competing in their industry online.",
    color: "border-brand-400 dark:border-brand-500",
    badge: "Most Popular",
    features: [
      "Full on-page SEO (all pages)",
      "3 content pieces/month",
      "30 keyword tracking",
      "Backlink building (5–10 links/month)",
      "Google Analytics + Search Console",
      "Competitor keyword analysis",
      "Monthly strategy call",
      "Priority WhatsApp support",
    ],
    note: "Best for: SMEs, law firms, clinics, logistics, schools",
  },
];

const addons = [
  { name: "SEO Audit", price: "GHS 800 – 1,200", desc: "Full technical + on-page audit with a prioritised action plan." },
  { name: "Keyword Research Report", price: "GHS 400 – 600", desc: "Targeted keyword list with search volume, difficulty and content ideas." },
  { name: "Content Strategy", price: "GHS 500 – 1,000", desc: "3-month editorial plan tailored to your business and audience." },
  { name: "Google My Business Setup", price: "GHS 300", desc: "Full GMB profile setup, photos, categories and first-week posts." },
  { name: "Extra Blog Post", price: "GHS 200 – 400", desc: "Additional SEO-optimised blog post beyond your monthly allowance." },
  { name: "Local Citations", price: "GHS 350", desc: "List your business on 20+ local directories to boost local rankings." },
];

const faqs = [
  { q: "How long before I see results?", a: "SEO typically takes 3–6 months to show meaningful results. Local SEO (Google Maps) can move faster, sometimes within 4–8 weeks of consistent work." },
  { q: "Do you write the content or do I?", a: "We write it for you. Every plan includes blog posts or web copy written specifically for your audience and optimised for your target keywords." },
  { q: "Is there a minimum contract length?", a: "We recommend a minimum of 3 months to see real results. Month-to-month is available, but SEO rewards consistency." },
  { q: "What's the difference between Local and Business SEO?", a: "Local SEO focuses on Google Maps visibility and nearby searches. Business SEO goes deeper — targeting competitive keywords, building backlinks, and growing organic traffic across your whole site." },
  { q: "Do you work with businesses outside Accra?", a: "Yes. We work with businesses across Ghana and with Ghanaian diaspora clients. Payments accepted via Paystack, Mobile Money or bank transfer." },
  { q: "Can I upgrade my plan later?", a: "Absolutely. Start with Local SEO and upgrade to Business SEO as your business grows — we'll carry over all the work we've done." },
  { q: "Do you offer one-time SEO work?", a: "Yes. If you just need an audit, keyword research or a content strategy without a monthly retainer, check our add-ons above." },
];

export default function SeoPage() {
  return (
    <div className="bg-paper dark:bg-ink text-gray-900 dark:text-white">

      {/* HERO */}
      <section className="pt-28 pb-16 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-4">SEO & Content Marketing</p>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">
            Get Found on Google.<br />Grow Organically.
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-8">
            Honest SEO for businesses in Accra and beyond — no jargon, no fake promises, just results you can measure.
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
          <Zap size={16} className="text-brand-500 flex-shrink-0" />
          <p className="text-sm text-brand-700 dark:text-brand-400 font-medium">
            We&apos;re currently taking a limited number of SEO clients to ensure quality.{" "}
            <Link href="/book-consultation" className="underline underline-offset-2 hover:no-underline">Book early to secure your slot.</Link>
          </p>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-3">Monthly Plans</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-3">Choose Your Plan</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-12">All plans are monthly retainers. Cancel anytime. We recommend at least 3 months for meaningful results.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {packages.map((pkg) => (
              <div key={pkg.name} className={`relative flex flex-col p-6 rounded-2xl border-2 bg-white dark:bg-slate-900 ${pkg.color}`}>
                {pkg.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap bg-brand-500 text-gray-900">
                    {pkg.badge}
                  </span>
                )}

                <div className="mb-5">
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-1">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-brand-500">{pkg.price}<span className="text-sm font-normal text-gray-600 dark:text-slate-500"> / month</span></p>
                </div>

                <p className="text-gray-500 dark:text-slate-400 text-xs leading-relaxed mb-5">{pkg.desc}</p>

                <ul className="space-y-2 mb-5 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-700 dark:text-slate-300">
                      <CheckCircle2 className="text-emerald-500 mt-0.5 flex-shrink-0" size={11} />
                      {f}
                    </li>
                  ))}
                </ul>

                <p className="text-[11px] text-gray-600 dark:text-slate-500 italic mb-5">{pkg.note}</p>

                <Link href="/book-consultation"
                  className={`block text-center py-2.5 rounded-full text-sm font-semibold transition ${
                    pkg.badge === "Most Popular"
                      ? "bg-brand-500 text-white hover:bg-brand-400"
                      : "border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white"
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
          <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-3">One-Time Work</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-3">Add-ons & One-Time Services</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-10">Not ready for a monthly plan? Start with a one-time project.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {addons.map((a) => (
              <div key={a.name} className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-ink">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{a.name}</p>
                  <span className="text-brand-500 font-bold text-sm whitespace-nowrap ml-2">{a.price}</span>
                </div>
                <p className="text-gray-600 dark:text-slate-500 text-xs leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-3">FAQ</p>
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
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">Not Sure Which Plan Is Right for You?</h2>
          <p className="text-gray-600 mb-7 text-sm">Book a free 30-minute call. We&apos;ll look at your site, understand your goals, and recommend exactly what you need.</p>
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
