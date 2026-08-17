import Link from "next/link";
import { FaCheckCircle, FaWhatsapp } from "react-icons/fa";

export const metadata = {
  title: "Branding & Identity Pricing | EazWorld",
  description: "Professional logo design and brand identity packages for businesses in Accra, Ghana. Transparent pricing, fast turnaround.",
};

const packages = [
  {
    name: "Logo Only",
    price: "GHS 500",
    priceRange: "GHS 500 – 900",
    period: "one-time",
    desc: "For individuals, small businesses and startups who need a clean, professional logo fast.",
    turnaround: "3–5 days",
    deposit: "50% upfront",
    color: "border-gray-100 dark:border-slate-800",
    badge: null,
    features: [
      "3 initial logo concepts",
      "2 rounds of revisions",
      "Final files: PNG, JPG, SVG",
      "Light & dark versions",
      "Social media ready sizes",
    ],
    note: "Best for: freelancers, new businesses, side projects",
  },
  {
    name: "Brand Starter",
    price: "GHS 1,500",
    priceRange: "GHS 1,500 – 2,500",
    period: "one-time",
    desc: "For small businesses who need a complete, consistent brand they can use everywhere.",
    turnaround: "5–10 days",
    deposit: "50% upfront",
    color: "border-brand-400 dark:border-brand-500",
    badge: "Most Popular",
    features: [
      "Logo design (3 concepts)",
      "Brand colour palette",
      "Typography selection",
      "Business card design",
      "Letterhead design",
      "Brand usage guide (PDF)",
      "3 rounds of revisions",
      "All source files included",
    ],
    note: "Best for: SMEs, clinics, schools, local businesses",
  },
  {
    name: "Brand Premium",
    price: "GHS 3,500",
    priceRange: "GHS 3,500 – 6,000",
    period: "one-time",
    desc: "For established businesses and startups who need a full brand identity system built to scale.",
    turnaround: "2–3 weeks",
    deposit: "50% upfront",
    color: "border-gray-100 dark:border-slate-800",
    badge: null,
    features: [
      "Brand strategy & positioning",
      "Logo suite (primary, secondary, icon)",
      "Full colour system",
      "Typography system",
      "Business card & stationery",
      "Social media templates (6)",
      "Brand guidelines document",
      "Unlimited revisions",
      "All source files (AI, PSD, SVG)",
    ],
    note: "Best for: startups, real estate, logistics, hospitality",
  },
];

const addons = [
  { name: "Social Media Kit", price: "GHS 400 – 700", desc: "Profile photo, cover image and post templates sized for Instagram, Facebook and Twitter/X." },
  { name: "Email Signature", price: "GHS 150", desc: "Branded HTML email signature that works across Gmail, Outlook and Apple Mail." },
  { name: "Flyer / Poster Design", price: "GHS 200 – 400", desc: "Print or digital flyer design using your brand colours and logo." },
  { name: "Pitch Deck Template", price: "GHS 600 – 1,200", desc: "10-slide branded PowerPoint or Google Slides template for investor or client presentations." },
  { name: "T-Shirt / Merch Design", price: "GHS 300 – 500", desc: "Print-ready design for branded merchandise — t-shirts, caps, bags and more." },
  { name: "Extra Logo Concept", price: "GHS 200", desc: "Additional logo direction beyond the included concepts." },
];

const faqs = [
  { q: "What file formats will I receive?", a: "You'll get PNG (transparent background), JPG, SVG, and where applicable, AI (Adobe Illustrator) and PDF source files. Everything you need for print and digital use." },
  { q: "Do I own the final logo?", a: "Yes. Once payment is complete, full ownership of the logo and brand assets transfers to you." },
  { q: "What do I need to provide?", a: "Your business name, a brief description of what you do, any reference logos or styles you like, and your preferred colours if you have them. We'll guide you through the rest." },
  { q: "Can I see examples of your work?", a: "Yes — visit our Portfolio page to see branding and design projects we've completed for clients." },
  { q: "What if I don't like any of the initial concepts?", a: "We'll work with you until you're happy. The Brand Starter and Premium plans include 3+ revision rounds, and the Premium plan includes unlimited revisions." },
  { q: "How do revisions work?", a: "After seeing the initial concepts, you provide feedback and we refine. One back-and-forth counts as one revision round." },
  { q: "Can you redesign an existing logo?", a: "Yes. We can modernise or completely redesign an existing brand. Just share what you have and tell us what you want to change." },
];

export default function BrandingPage() {
  return (
    <div className="bg-paper dark:bg-ink text-gray-900 dark:text-white">

      {/* HERO */}
      <section className="pt-28 pb-16 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-4">Branding & Identity</p>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">
            Look the Part.<br />Stand Out.
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-8">
            Professional logos and brand identities for businesses in Accra — built to make a lasting first impression.
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

      {/* PACKAGES */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-3">Packages</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-3">Choose Your Package</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-12">All prices are one-time. 50% deposit required to begin.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.name} className={`relative flex flex-col p-6 rounded-2xl border-2 bg-white dark:bg-slate-900 ${pkg.color}`}>
                {pkg.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap bg-brand-500 text-white">
                    {pkg.badge}
                  </span>
                )}
                <div className="mb-5">
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-1">{pkg.name}</h3>
                  <p className="text-2xl font-bold text-brand-500">{pkg.price}<span className="text-sm font-normal text-gray-400 dark:text-slate-500"> starting</span></p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{pkg.priceRange}</p>
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
                <div className="space-y-1.5 text-xs text-gray-400 dark:text-slate-500 border-t border-gray-100 dark:border-slate-800 pt-4 mb-5">
                  <div className="flex justify-between"><span>Turnaround</span><span className="text-gray-700 dark:text-slate-300 font-medium">{pkg.turnaround}</span></div>
                  <div className="flex justify-between"><span>Deposit</span><span className="text-gray-700 dark:text-slate-300 font-medium">{pkg.deposit}</span></div>
                </div>
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
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">Not Sure Which Package You Need?</h2>
          <p className="text-gray-400 mb-7 text-sm">Book a free 30-minute call. We&apos;ll talk about your business and recommend the right branding package — no pressure.</p>
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
