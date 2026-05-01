import ContactForm from "@/components/ContactForm";
import Link from "next/link";
import { FaMapMarkerAlt, FaClock, FaEnvelope, FaPhone } from "react-icons/fa";

export const metadata = {
  title: "Contact Us | EazWorld",
  description: "Get in touch with EazWorld. We respond within 24 hours.",
};

export default function Contact() {
  return (
    <div className="bg-white text-gray-900">
      <section className="pt-28 pb-14 px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">Get in Touch</p>
          <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 mb-4">We&apos;d Love to Hear From You</h1>
          <p className="text-gray-500 text-lg">Send us a message and we&apos;ll get back to you within 24 hours.</p>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_320px] gap-12">
          <div>
            <h2 className="font-display font-bold text-2xl text-gray-900 mb-6">Send a Message</h2>
            <ContactForm />
          </div>

          <div className="space-y-5">
            <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-4">Contact Details</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <FaEnvelope className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <a href="mailto:hello@eazworld.com" className="text-gray-600 hover:text-gray-900 transition">hello@eazworld.com</a>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <FaPhone className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <a href="tel:+233000000000" className="text-gray-600 hover:text-gray-900 transition">+233 (0) 00 000 0000</a>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <FaMapMarkerAlt className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">123 Digital Avenue, Osu, Accra, Ghana</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <FaClock className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Mon–Fri 9AM–6PM, Sat 10AM–4PM</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-gray-100 bg-white text-center">
              <p className="text-gray-500 text-sm mb-3">Prefer a scheduled call?</p>
              <Link href="/book-consultation" className="block py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition">
                Book a Free Consultation
              </Link>
            </div>

            <div className="p-5 rounded-2xl border border-gray-100 bg-white text-center">
              <p className="text-gray-500 text-sm mb-3">Phone repair? Just walk in.</p>
              <Link href="/visit-us" className="block py-2.5 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition">
                Get Directions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
