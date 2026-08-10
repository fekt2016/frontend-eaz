import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="relative py-24 px-4 bg-amber-50 dark:bg-slate-900 overflow-hidden border-t border-amber-100 dark:border-slate-800">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[300px] rounded-full bg-amber-400/10 dark:bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">
          Let&apos;s Work Together
        </p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white mb-4">
          Ready to Grow Your Business?
        </h2>
        <p className="text-gray-500 dark:text-slate-400 mb-10 text-lg leading-relaxed">
          Book a free 30-minute consultation or visit us in Accra. No obligation, just honest advice.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/book-consultation"
            className="px-6 py-3 rounded-full bg-gray-900 dark:bg-amber-500 text-white font-semibold hover:bg-gray-700 dark:hover:bg-amber-400 transition text-sm shadow-lg shadow-gray-900/10 dark:shadow-amber-500/20"
          >
            Schedule Free Consultation
          </Link>
          <Link
            href="/visit-us"
            className="px-6 py-3 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-medium hover:bg-white dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-slate-500 transition text-sm"
          >
            Visit Our Office
          </Link>
        </div>
        <p className="text-gray-400 dark:text-slate-600 text-xs mt-6">
          Or email us at{" "}
          <a
            href="mailto:info@eazworld.co"
            className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            info@eazworld.co
          </a>
        </p>
      </div>
    </section>
  );
}
