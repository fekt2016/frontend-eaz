"use client";

import { useState } from "react";
import Link from "next/link";
import { FaCheckCircle, FaWhatsapp, FaCreditCard } from "react-icons/fa";
import ServicePaymentModal from "@/components/ServicePaymentModal";

const packages = [
  {
    name: "Landing Page",
    price: "GHS 800",
    priceRange: "GHS 800 – 2,000",
    deposit: 400,
    total: 800,
    period: "one-time",
    desc: "Perfect for individuals, churches, and small local businesses who need a strong online presence fast.",
    turnaround: "3–5 days",
    depositLabel: "50% upfront",
    color: "border-gray-100 dark:border-slate-800",
    badge: null,
    features: [
      "1 fully responsive page",
      "Contact form",
      "Google Maps integration",
      "Basic on-page SEO",
      "Mobile optimised",
      "Free SSL certificate",
      "1 round of revisions",
    ],
  },
  {
    name: "Business Website",
    price: "GHS 2,500",
    priceRange: "GHS 2,500 – 6,000",
    deposit: 1250,
    total: 2500,
    period: "one-time",
    desc: "For SMEs, clinics, schools, law firms and logistics companies who need a complete professional website.",
    turnaround: "1–2 weeks",
    depositLabel: "50% upfront",
    color: "border-brand-400 dark:border-brand-500",
    badge: "Most Popular",
    features: [
      "Up to 8 pages",
      "Custom design",
      "Blog / news section",
      "Contact & enquiry forms",
      "Google Analytics setup",
      "On-page SEO",
      "Mobile & tablet optimised",
      "2 rounds of revisions",
      "30 days post-launch support",
    ],
  },
  {
    name: "E-commerce Store",
    price: "GHS 6,000",
    priceRange: "GHS 6,000 – 15,000",
    deposit: 3000,
    total: 6000,
    period: "one-time",
    desc: "For startups and businesses ready to sell online — fashion, food, products and more.",
    turnaround: "3–6 weeks",
    depositLabel: "50% upfront",
    color: "border-gray-100 dark:border-slate-800",
    badge: null,
    features: [
      "Product listings & categories",
      "Shopping cart",
      "Paystack / Mobile Money checkout",
      "Order management dashboard",
      "Customer accounts",
      "Inventory management",
      "Email order notifications",
      "Mobile optimised",
      "3 rounds of revisions",
      "60 days post-launch support",
    ],
  },
  {
    name: "Web Application",
    price: "GHS 15,000",
    priceRange: "GHS 15,000 – 40,000+",
    deposit: 7500,
    total: 15000,
    period: "one-time",
    desc: "Custom platforms, portals, booking systems and dashboards built to your exact requirements.",
    turnaround: "6–16 weeks",
    depositLabel: "50% upfront",
    color: "border-gray-100 dark:border-slate-800",
    badge: "Custom",
    features: [
      "Custom backend & database",
      "User authentication & roles",
      "Admin dashboard",
      "API integrations",
      "Advanced search & filters",
      "Real-time features",
      "Scalable architecture",
      "Full test coverage",
      "Dedicated project manager",
      "90 days post-launch support",
    ],
  },
];

const addons = [
  { name: "Monthly Maintenance", price: "GHS 200 – 600/mo", desc: "Updates, backups, security monitoring and minor content changes." },
  { name: "Logo & Branding", price: "GHS 500 – 1,500", desc: "Professional logo design with brand colour palette and usage guide." },
  { name: "SEO Setup", price: "GHS 600 – 2,000", desc: "Keyword research, on-page optimisation, Google Search Console & Analytics." },
  { name: "Copywriting", price: "GHS 300 – 800", desc: "Professional page copy written for your target audience." },
  { name: "Domain & Hosting", price: "From GHS 200/yr", desc: "Domain registration + managed hosting with free SSL included." },
  { name: "Extra Revisions", price: "GHS 150/round", desc: "Additional revision rounds beyond what's included in your package." },
];

const faqs = [
  { q: "Do you require a deposit?", a: "Yes — we require 50% upfront before work begins. The remaining 50% is due on delivery before the site goes live." },
  { q: "Can I pay without a consultation?", a: "Yes! You can pay your deposit directly online to secure your slot and we'll reach out to discuss your requirements. No consultation needed to get started." },
  { q: "What do I need to provide?", a: "Your logo, images, content (text), and any brand colours you prefer. If you don't have these, we offer copywriting and branding as add-ons." },
  { q: "Will my site work on mobile?", a: "Absolutely. Every site we build is fully mobile and tablet responsive — we design mobile-first." },
  { q: "Do you offer hosting?", a: "Yes. We can host your website for you at an additional cost, or deploy it to a hosting provider of your choice." },
  { q: "How many revisions are included?", a: "Each package includes a set number of revision rounds (see above). Additional rounds are available at GHS 150 each." },
  { q: "Can I upgrade my package later?", a: "Yes. You can start with a Business Website and upgrade to E-commerce or a full Web Application as your business grows." },
  { q: "Do you work with diaspora clients?", a: "Yes. We work with Ghanaian diaspora clients globally. Payments in GHS via Paystack or Mobile Money." },
];

export default function WebDesignPage() {
  const [selectedPkg, setSelectedPkg] = useState(null);

  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white">

      {/* PAYMENT MODAL */}
      {selectedPkg && (
        <ServicePaymentModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />
      )}

      {/* HERO */}
      <section className="pt-28 pb-16 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-4">Web Design & Development</p>
          <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">
            Transparent Pricing.<br />No Surprises.
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-8">
            From a simple landing page to a full web application — honest pricing for businesses in Accra and beyond.
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
            We&apos;re currently taking a limited number of projects to ensure quality.{" "}
            <Link href="/book-consultation" className="underline underline-offset-2 hover:no-underline">Book early to secure your slot.</Link>
          </p>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">Packages</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-3">Choose Your Package</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-12">All prices are one-time. 50% deposit required to begin. Hosting and domain are separate.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.name} className={`relative flex flex-col p-6 rounded-2xl border-2 bg-white dark:bg-slate-900 ${pkg.color}`}>
                {pkg.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${
                    pkg.badge === "Most Popular"
                      ? "bg-brand-500 text-white"
                      : "bg-gray-900 dark:bg-slate-700 text-white"
                  }`}>
                    {pkg.badge}
                  </span>
                )}

                <div className="mb-5">
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-1">{pkg.name}</h3>
                  <p className="text-2xl font-black text-brand-500">{pkg.price}<span className="text-sm font-normal text-gray-400 dark:text-slate-500"> starting</span></p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{pkg.priceRange}</p>
                </div>

                <p className="text-gray-500 dark:text-slate-400 text-xs leading-relaxed mb-5">{pkg.desc}</p>

                <ul className="space-y-2 mb-6 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-700 dark:text-slate-300">
                      <FaCheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" size={11} />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="space-y-1.5 text-xs text-gray-400 dark:text-slate-500 border-t border-gray-100 dark:border-slate-800 pt-4 mb-5">
                  <div className="flex justify-between"><span>Turnaround</span><span className="text-gray-700 dark:text-slate-300 font-medium">{pkg.turnaround}</span></div>
                  <div className="flex justify-between"><span>Deposit</span><span className="text-gray-700 dark:text-slate-300 font-medium">GH₵{pkg.deposit.toLocaleString()}</span></div>
                </div>

                {/* Two action buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedPkg(pkg)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition ${
                      pkg.badge === "Most Popular"
                        ? "bg-brand-500 text-white hover:bg-brand-400"
                        : "bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400"
                    }`}
                  >
                    <FaCreditCard size={11} /> Pay GH₵{pkg.deposit.toLocaleString()} Deposit
                  </button>
                  <Link
                    href="/book-consultation"
                    className="block text-center py-2.5 rounded-full text-sm font-semibold border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white transition"
                  >
                    Book Consultation Instead
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADD-ONS */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">Add-ons</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-10">Optional Extras</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {addons.map((a) => (
              <div key={a.name} className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
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
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">FAQ</p>
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
          <p className="text-gray-400 mb-7 text-sm">Book a free 30-minute consultation. We&apos;ll listen to your goals and recommend the right solution — no pressure.</p>
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
