import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="py-24 px-4 bg-gray-900">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-4">Let&apos;s Work Together</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">
          Ready to Grow Your Business?
        </h2>
        <p className="text-gray-400 mb-10 text-lg">
          Book a free 30-minute consultation or visit us in Accra. No obligation, just honest advice.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/book-consultation"
            className="px-6 py-3 rounded-full bg-amber-500 text-white font-semibold hover:bg-amber-400 transition text-sm"
          >
            Schedule Free Consultation
          </Link>
          <Link
            href="/visit-us"
            className="px-6 py-3 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition text-sm"
          >
            Visit Our Office
          </Link>
        </div>
        <p className="text-gray-500 text-xs mt-6">
          Or email us at{" "}
          <a href="mailto:hello@eazworld.com" className="text-gray-400 hover:text-white transition">
            hello@eazworld.com
          </a>
        </p>
      </div>
    </section>
  );
}
