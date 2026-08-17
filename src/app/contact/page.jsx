import ContactForm from "@/components/ContactForm";
import Link from "next/link";
import { FaMapMarkerAlt, FaClock, FaEnvelope, FaPhone, FaWhatsapp } from "react-icons/fa";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact Us | EazWorld",
  description:
    "Get in touch with EazWorld in Accra, Ghana. Web design, SEO, hosting, domain, and phone repair enquiries — we respond within 24 hours.",
  path: "/contact",
});

export default function Contact() {
  return (
    <div className="bg-paper dark:bg-ink text-gray-900 dark:text-white">
      <section className="pt-28 pb-14 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-4">Get in Touch</p>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">We&apos;d Love to Hear From You</h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg">Send us a message and we&apos;ll get back to you within 24 hours.</p>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_320px] gap-12">
          <div>
            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">Send a Message</h2>
            <ContactForm />
          </div>

          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Details</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <FaEnvelope className="text-brand-500 mt-0.5 flex-shrink-0" />
                  <a href="mailto:info@eazworld.co" className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition">info@eazworld.co</a>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <FaPhone className="text-brand-500 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <a href="tel:+233244388190" className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition">+233 24 438 8190</a>
                    <a href="tel:+233235222207" className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition">+233 23 522 2207</a>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <FaWhatsapp className="text-emerald-500 mt-0.5 flex-shrink-0" size={15} />
                  <a href="https://wa.me/233244388190" target="_blank" rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition">
                    Chat on WhatsApp
                  </a>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <FaMapMarkerAlt className="text-brand-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-slate-400">E1/12 Nima, Alwaleed bin Talal Highway, Nima, Accra</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <FaClock className="text-brand-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-slate-400">Mon–Fri 9AM–6PM, Sat 10AM–4PM</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-3">Prefer a scheduled call?</p>
              <Link href="/book-consultation" className="block py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition">
                Book a Free Consultation
              </Link>
            </div>

            <div className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-3">Phone repair? Just walk in.</p>
              <Link href="/visit-us" className="block py-2.5 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-paper dark:hover:bg-slate-800 transition">
                Get Directions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
