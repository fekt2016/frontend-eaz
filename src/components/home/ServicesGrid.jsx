import Link from "next/link";
import StarRule from "@/components/common/StarRule";
import {
  Palette, Search, Megaphone, Star,
  Hash, Mail, Smartphone, CheckCircle2,
} from "lucide-react";

const services = [
  {
    icon: Palette,
    title: "Web Design",
    description: "Modern, responsive websites tailored to your brand and built to convert visitors into customers.",
    benefits: ["Mobile-first responsive design", "Fast loading & SEO ready", "Custom to your brand"],
    href: "/services/web-design",
    accent: "#F5A623",
  },
  {
    icon: Search,
    title: "SEO",
    description: "Rank higher on Google and attract customers who are already searching for what you offer.",
    benefits: ["Keyword research & strategy", "On-page optimisation", "Monthly ranking reports"],
    href: "/services/seo",
    accent: "#10b981",
  },
  {
    icon: Megaphone,
    title: "Paid Advertising",
    description: "Google and Meta campaigns that put your brand in front of the right people at the right time.",
    benefits: ["Google & Facebook Ads", "Precise audience targeting", "ROI-focused optimisation"],
    href: "/services/paid-ads",
    accent: "#3b82f6",
  },
  {
    icon: Star,
    title: "Branding",
    description: "Logo, identity, and brand strategy that makes your business instantly recognisable and trustworthy.",
    benefits: ["Logo & visual identity", "Brand voice & guidelines", "Competitor differentiation"],
    href: "/services/branding",
    accent: "#8b5cf6",
  },
  {
    icon: Hash,
    title: "Social Media",
    description: "Consistent, creative social media management that builds your audience and drives engagement.",
    benefits: ["Content creation & scheduling", "Community management", "Growth analytics"],
    href: "/services/social-media",
    accent: "#ec4899",
  },
  {
    icon: Mail,
    title: "Email Marketing",
    description: "Strategic campaigns that turn your subscriber list into a reliable revenue channel.",
    benefits: ["Automated email sequences", "List segmentation", "Open rate optimisation"],
    href: "/services/email",
    accent: "#f59e0b",
  },
  {
    icon: Smartphone,
    title: "Phone Repair",
    description: "Fast, professional phone repair in Accra. All major brands, 30-day warranty, honest prices.",
    benefits: ["Screen, battery & port repair", "All major brands accepted", "Walk-ins welcome"],
    href: "/services/phone-repair",
    accent: "#06b6d4",
    distinct: true,
  },
];

export default function ServicesGrid() {
  return (
    <section className="py-24 px-4 bg-white dark:bg-ink">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-3">What We Do</p>
          <StarRule className="mb-4" />
          <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white mb-4">
            Everything Your Business Needs Online
          </h2>
          <p className="text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
            Six digital services and in-person phone repair — all from one trusted team in Accra.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.title}
              className={`group p-8 rounded-2xl border transition hover:-translate-y-1 hover:shadow-md ${
                s.distinct
                  ? "border-cyan-100 dark:border-cyan-900/30 bg-cyan-50/50 dark:bg-cyan-900/10"
                  : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700"
              }`}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${s.accent}18` }}
              >
                <s.icon size={24} style={{ color: s.accent }} />
              </div>
              <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">{s.title}</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-4">{s.description}</p>
              <ul className="space-y-1.5 mb-5">
                {s.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300">
                    <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" style={{ color: s.accent }} />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href={s.href}
                className="text-sm font-medium transition"
                style={{ color: s.accent }}
              >
                Learn more →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
