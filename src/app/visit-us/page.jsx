import Link from "next/link";
import { MapPin, Clock, Phone, Mail, CheckCircle2, Wifi, Snowflake, Car, Star } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Visit Us — Nima, Accra, Ghana",
  description:
    "Visit EazWorld in person — E1/12 Nima, Alwaleed bin Talal Highway, Nima, Accra. Phone repair, digital consultations and walk-ins welcome. Mon–Fri 9AM–6PM, Sat 10AM–4PM.",
  path: "/visit-us",
});

const amenities = [
  { icon: Snowflake, label: "Air Conditioning" },
  { icon: Wifi, label: "Free WiFi" },
  { icon: Car, label: "Free Parking" },
  { icon: CheckCircle2, label: "Comfortable Waiting Area" },
  { icon: CheckCircle2, label: "Refreshments" },
  { icon: CheckCircle2, label: "Friendly Staff" },
];

const testimonials = [
  { quote: "Clean, professional space. Fixed my phone and had a great consultation in the same visit.", name: "K. Mensah", service: "Phone Repair + Web Consult" },
  { quote: "Easy to find, welcoming team. Walked in without an appointment and was seen immediately.", name: "E. Ofori", service: "Web Design Consultation" },
];

export default function VisitUs() {
  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white">
      {/* HERO */}
      <section className="pt-28 pb-14 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-4">Visit Us in Accra</p>
          <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">Come See Us In Person</h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg">Phone repair, digital consultations, or just to say hello — we&apos;re in Accra and always happy to meet face to face.</p>
        </div>
      </section>

      {/* MAP + INFO */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-7 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Open Now
            </div>
            {[
              { icon: MapPin, label: "Address", value: "E1/12 Nima, Alwaleed bin Talal Highway, Nima, Accra" },
              { icon: Clock, label: "Hours", value: "Mon–Fri: 9AM–6PM · Sat: 10AM–4PM · Sun: Closed" },
              { icon: Phone, label: "Phone", value: "+233 24 438 8190 / +233 23 522 2207" },
              { icon: Mail, label: "Email", href: "mailto:info@eazworld.co", value: "info@eazworld.co" },
            ].map(({ icon: Ic, label, value, href }) => (
              <div key={label} className="flex items-start gap-3 text-sm">
                <Ic className="text-brand-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 dark:text-slate-500 text-xs mb-0.5">{label}</p>
                  {href ? <a href={href} className="text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition">{value}</a> : <p className="text-gray-700 dark:text-slate-300">{value}</p>}
                </div>
              </div>
            ))}
            {/* WhatsApp */}
            <a
              href="https://wa.me/233244388190"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition"
            >
              <FaWhatsapp className="text-emerald-500" size={20} />
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">WhatsApp Us</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-500">+233 24 438 8190</p>
              </div>
            </a>
            <div className="flex flex-wrap gap-2 pt-2">
              <a href="https://maps.google.com/?q=Nima+Alwaheed+Highway+Nima+Accra+Ghana" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-xs font-medium hover:bg-gray-700 dark:hover:bg-gray-100 transition">Get Directions</a>
              <a href="tel:+233244388190" className="px-4 py-2 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition">Call Ahead</a>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
            <iframe
              title="EazWorld Office"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.624!2d-0.21868!3d5.57285!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9b9a91c8fc15%3A0x7c6e5d2a8d0a5e0e!2sNima%2C%20Accra%2C%20Ghana!5e0!3m2!1sen!2sgh!4v1700000000000"
              width="100%" height="100%" style={{ border: 0, minHeight: "320px", display: "block" }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* AMENITIES */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">Our Space</p>
          <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-8">Comfortable & Professional</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {amenities.map((a) => (
              <div key={a.label} className="flex items-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-sm text-gray-700 dark:text-slate-300">
                <a.icon className="text-brand-500 flex-shrink-0" size={14} />
                {a.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT TO EXPECT */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-7 rounded-2xl border border-brand-50 dark:border-brand-900/20 bg-brand-50 dark:bg-brand-900/10">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">For a Digital Consultation</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">Sit down with one of our strategists for a free 30-minute session. We&apos;ll discuss your goals and give honest recommendations — no pressure.</p>
          </div>
          <div className="p-7 rounded-2xl border border-cyan-50 dark:border-cyan-900/20 bg-cyan-50 dark:bg-cyan-900/10">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">For Phone Repair</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">Walk in, hand over your device, and our technician will assess it in minutes. Free quote before we start. Most repairs done while you wait.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">Reviews</p>
          <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-8">What Visitors Say</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                <div className="flex gap-0.5 text-brand-400 text-sm mb-3">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} className="text-brand-400" />)}
                </div>
                <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                <p className="text-gray-400 dark:text-slate-500 text-xs">{t.service}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
          <div className="p-7 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
            <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Book a Consultation</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-5">Free 30-minute session — in person, phone, or video.</p>
            <Link href="/book-consultation" className="block py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition">Book Now →</Link>
          </div>
          <div className="p-7 rounded-2xl border border-cyan-100 dark:border-cyan-900/30 bg-cyan-50 dark:bg-cyan-900/10 text-center">
            <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Phone Repair Walk-In</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-5">No appointment needed. Walk in and we&apos;ll assess your device right away.</p>
            <Link href="/services/phone-repair" className="block py-3 rounded-full bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 transition">Learn About Repairs →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
