import Link from "next/link";
import { CheckCircle2, Zap } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export const metadata = {
  title: "Email Marketing Pricing | EazWorld",
  description: "Email marketing campaigns and automation for businesses in Accra, Ghana. Grow your list, send better emails, and convert subscribers into customers.",
};

const packages = [
  {
    name: "Email Starter",
    price: "GHS 500",
    priceRange: "GHS 500/mo",
    period: "monthly",
    desc: "For small businesses who want to stay in touch with their customers through a professional monthly newsletter.",
    color: "border-gray-100 dark:border-slate-800",
    badge: null,
    features: [
      "1 email campaign per month",
      "Up to 1,000 subscribers",
      "Custom-designed email template",
      "Copywriting included",
      "List setup & management",
      "Basic performance report (opens, clicks)",
      "WhatsApp support",
    ],
    note: "Best for: shops, clinics, churches, local businesses",
  },
  {
    name: "Email Business",
    price: "GHS 1,200",
    priceRange: "GHS 1,200/mo",
    period: "monthly",
    desc: "For growing businesses who want consistent email campaigns, automation and proper list segmentation.",
    color: "border-brand-400 dark:border-brand-500",
    badge: "Most Popular",
    features: [
      "2 email campaigns per month",
      "Up to 5,000 subscribers",
      "Custom email template design",
      "Copywriting included",
      "Welcome automation sequence",
      "List segmentation",
      "A/B subject line testing",
      "Monthly analytics report",
      "Monthly strategy call",
      "Priority WhatsApp support",
    ],
    note: "Best for: e-commerce, SMEs, schools, real estate, logistics",
  },
];

const addons = [
  { name: "Email Platform Setup", price: "GHS 400", desc: "Full setup of Mailchimp, Brevo or your chosen platform — lists, domain authentication, templates." },
  { name: "Welcome Automation", price: "GHS 500 – 800", desc: "A 3–5 email welcome sequence that automatically nurtures new subscribers." },
  { name: "Abandoned Cart Sequence", price: "GHS 600 – 1,000", desc: "Automated recovery emails for e-commerce stores to win back lost sales." },
  { name: "Extra Campaign", price: "GHS 300/email", desc: "Additional email campaign beyond your monthly allowance." },
  { name: "List Cleaning", price: "GHS 250", desc: "Remove inactive and invalid addresses to improve deliverability and open rates." },
  { name: "Email Audit", price: "GHS 350", desc: "Review of your existing email setup with recommendations on design, copy and automation." },
];

const faqs = [
  { q: "Which email platform do you use?", a: "We work with Mailchimp, Brevo (formerly Sendinblue), and Klaviyo. We'll recommend the best platform based on your budget and needs." },
  { q: "Do the platform fees come out of my plan?", a: "No. Platform subscription costs (Mailchimp, Brevo, etc.) are paid separately by you. Many platforms have a free tier that's sufficient for the Starter plan." },
  { q: "Do you write the email content?", a: "Yes. Copywriting is included in every plan. You provide the key information (promotions, news, updates) and we craft the email copy and design." },
  { q: "What is a welcome automation?", a: "A series of 3–5 emails automatically sent to new subscribers over their first 1–2 weeks. It introduces your brand, builds trust and encourages a first purchase or enquiry." },
  { q: "How do I grow my email list?", a: "We can advise on list-building tactics — website signup forms, lead magnets, and social media promotions. List-building strategy is included in monthly consultations." },
  { q: "Is there a minimum contract?", a: "We recommend 2 months minimum. Email marketing builds momentum over time — one campaign rarely shows the full picture." },
  { q: "Can you migrate my existing list?", a: "Yes. If you already have a subscriber list in another tool, we'll migrate it to your new platform at no extra charge." },
];

export default function EmailMarketingPage() {
  return (
    <div className="bg-paper dark:bg-ink text-gray-900 dark:text-white">

      {/* HERO */}
      <section className="pt-28 pb-16 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-4">Email Marketing</p>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">
            Stay in Their Inbox.<br />Stay Top of Mind.
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-8">
            Professional email campaigns designed, written and sent for you — to keep customers coming back.
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
            We&apos;re currently taking a limited number of email clients to ensure quality.{" "}
            <Link href="/book-consultation" className="underline underline-offset-2 hover:no-underline">Book early to secure your slot.</Link>
          </p>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-3">Monthly Plans</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-3">Choose Your Plan</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-12">Email platform subscription (Mailchimp, Brevo, etc.) is paid separately by you.</p>

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
          <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-3">Add-ons</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-10">Optional Extras</h2>
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
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">Start Sending Emails That Convert</h2>
          <p className="text-gray-600 mb-7 text-sm">Book a free call. We&apos;ll look at your current situation and recommend the right email strategy for your business.</p>
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
