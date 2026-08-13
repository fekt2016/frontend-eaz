import Link from "next/link";
import { FaSearch, FaCheckCircle } from "react-icons/fa";
import { buildMetadata } from "@/lib/seo";

const SEO_FEATURES = [
  "On-page SEO optimisation",
  "Keyword research and strategy",
  "Technical SEO audits",
  "Content optimisation",
  "Link building campaigns",
  "Local SEO services",
  "SEO performance tracking and reporting",
  "Google Analytics setup",
  "Search Console integration",
  "Monthly SEO reports and recommendations",
];

export const metadata = buildMetadata({
  title: "SEO Services in Ghana | EazWorld",
  description:
    "Improve your search engine rankings and grow organic traffic with EazWorld's comprehensive SEO services for Ghanaian and African businesses.",
  path: "/seo",
});

export default function SEOPage() {
  return (
    <div className="bg-white text-gray-900">
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-24">
        <Link href="/services" className="text-gray-400 text-sm hover:text-gray-700 transition mb-8 inline-block">
          ← Back to Services
        </Link>

        {/* Header */}
        <div className="flex items-start gap-5 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
            <FaSearch size={26} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="font-display font-black text-4xl text-gray-900 mb-2">SEO Services</h1>
            <p className="text-gray-500 leading-relaxed">
              Improve your search engine rankings and grow organic traffic with our comprehensive SEO services — built for Ghanaian and African businesses.
            </p>
          </div>
        </div>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="font-display font-bold text-2xl text-gray-900 mb-3">Search Engine Optimisation</h2>
          <p className="text-gray-500 leading-relaxed">
            Comprehensive SEO services to improve your search engine rankings. We optimise your website for better visibility, organic traffic, and higher conversion rates — with a focus on what works in the Ghanaian market.
          </p>
        </section>

        {/* Features */}
        <section className="mb-12 p-7 rounded-2xl bg-gray-50 border border-gray-100">
          <h2 className="font-display font-bold text-xl text-gray-900 mb-5">What We Offer</h2>
          <ul className="space-y-3">
            {SEO_FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-gray-600 text-sm">
                <FaCheckCircle size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/contact"
            className="inline-flex px-8 py-4 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition"
          >
            Get a Free SEO Audit →
          </Link>
          <p className="text-gray-400 text-sm mt-3">No commitment. We&apos;ll show you exactly what to fix.</p>
        </div>
      </div>
    </div>
  );
}
