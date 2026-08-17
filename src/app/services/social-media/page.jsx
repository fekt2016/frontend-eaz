import Link from "next/link";
import { CheckCircle2, Zap } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export const metadata = {
  title: "Social Media Management Pricing | EazWorld",
  description: "Social media management for businesses in Accra, Ghana. Consistent posting, community management and content creation across Facebook, Instagram and more.",
};

const packages = [
  {
    name: "Social Starter",
    price: "GHS 600",
    priceRange: "GHS 600/mo",
    period: "monthly",
    desc: "For small businesses who want a consistent, professional presence on social media without the hassle.",
    color: "border-gray-100 dark:border-slate-800",
    badge: null,
    features: [
      "2 platforms (Facebook + Instagram)",
      "8 posts per month",
      "Custom-designed graphics",
      "Caption copywriting",
      "Hashtag strategy",
      "Monthly content calendar",
      "WhatsApp support",
    ],
    note: "Best for: shops, churches, salons, local services",
  },
  {
    name: "Social Business",
    price: "GHS 1,500",
    priceRange: "GHS 1,500/mo",
    period: "monthly",
    desc: "For growing businesses who want real engagement, consistent brand presence and community management.",
    color: "border-brand-400 dark:border-brand-500",
    badge: "Most Popular",
    features: [
      "3 platforms (Facebook, Instagram, Twitter/X)",
      "16 posts per month",
      "Custom-designed graphics + short video reels",
      "Caption copywriting",
      "Community management (comments & DMs)",
      "Stories content (3x/week)",
      "Monthly analytics report",
      "Monthly strategy call",
      "Priority WhatsApp support",
    ],
    note: "Best for: SMEs, clinics, restaurants, real estate, logistics",
  },
];

const addons = [
  { name: "Profile Setup & Optimisation", price: "GHS 300", desc: "Full setup or refresh of your Facebook, Instagram or Twitter/X profile with bio, branding and highlights." },
  { name: "Reel / Short Video", price: "GHS 200 – 400/video", desc: "Scripted and edited short-form video content for Instagram Reels or TikTok." },
  { name: "Content Shoot Coordination", price: "GHS 400", desc: "We coordinate and brief a local photographer for a product or lifestyle shoot to stock your content." },
  { name: "Social Media Audit", price: "GHS 350", desc: "Full review of your existing profiles with a clear action plan to improve reach and engagement." },
  { name: "Extra Posts", price: "GHS 80/post", desc: "Additional posts beyond your monthly allowance." },
  { name: "TikTok Management", price: "GHS 500/mo add-on", desc: "TikTok content strategy and posting added on top of any existing plan." },
];

const faqs = [
  { q: "Do you create the graphics or do I need to provide them?", a: "We create everything — graphics, captions and hashtags. You just approve the content calendar each month before we post." },
  { q: "Which platforms do you manage?", a: "Facebook, Instagram and Twitter/X are included in our plans. TikTok is available as an add-on." },
  { q: "How does approval work?", a: "We send you a content calendar at the start of each month with all planned posts for your review and approval before anything goes live." },
  { q: "Will you respond to comments and messages?", a: "Community management (responding to comments and DMs) is included in the Business plan. For the Starter plan, we flag important messages for you to respond to." },
  { q: "Do I need to provide content or photos?", a: "It helps, but it's not required. We can work with stock images, branded graphics, and product shots you share with us. For best results, we recommend occasional real photos of your business." },
  { q: "Is there a minimum contract?", a: "We recommend a minimum of 2 months. Consistency is key to social media growth — one month rarely shows meaningful results." },
  { q: "Can I pause or cancel?", a: "Yes, with 30 days notice. We don't lock you into long contracts." },
];

export default function SocialMediaPage() {
  return (
    <div className="bg-paper dark:bg-ink text-gray-900 dark:text-white">

      {/* HERO */}
      <section className="pt-28 pb-16 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-4">Social Media Management</p>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">
            Your Brand, Active<br />Every Day.
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-8">
            Consistent, quality content posted for you — so you can focus on running your business.
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
            We&apos;re currently taking a limited number of social media clients.{" "}
            <Link href="/book-consultation" className="underline underline-offset-2 hover:no-underline">Book early to secure your slot.</Link>
          </p>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-3">Monthly Plans</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-3">Choose Your Plan</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-12">All plans are monthly. Cancel anytime with 30 days notice.</p>

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
                      <CheckCircle2 className="text-emerald-500 mt-0.5 flex-shrink-0" size={11} />
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
          <h2 className="font-display font-bold text-2xl md:text-3xl text-white mb-3">Let&apos;s Grow Your Social Presence</h2>
          <p className="text-gray-400 mb-7 text-sm">Book a free call. We&apos;ll look at your current profiles and tell you exactly what needs to change.</p>
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
