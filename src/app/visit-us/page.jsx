import Link from "next/link";
import { FaMapMarkerAlt, FaClock, FaPhone, FaEnvelope, FaCheckCircle, FaWifi, FaSnowflake, FaCar } from "react-icons/fa";

const amenities = [
  { icon: FaSnowflake, label: "Air Conditioning" },
  { icon: FaWifi, label: "Free WiFi" },
  { icon: FaCar, label: "Free Parking" },
  { icon: FaCheckCircle, label: "Comfortable Waiting Area" },
  { icon: FaCheckCircle, label: "Refreshments" },
  { icon: FaCheckCircle, label: "Friendly Staff" },
];

const testimonials = [
  { quote: "Clean, professional space. Fixed my phone and had a great consultation in the same visit.", name: "K. Mensah", service: "Phone Repair + Web Consult" },
  { quote: "Easy to find, welcoming team. Walked in without an appointment and was seen immediately.", name: "E. Ofori", service: "Web Design Consultation" },
];

export default function VisitUs() {
  return (
    <div className="bg-white text-gray-900">
      {/* HERO */}
      <section className="pt-28 pb-14 px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">Visit Us in Accra</p>
          <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 mb-4">Come See Us In Person</h1>
          <p className="text-gray-500 text-lg">Phone repair, digital consultations, or just to say hello — we&apos;re in Accra and always happy to meet face to face.</p>
        </div>
      </section>

      {/* MAP + INFO */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-7 rounded-2xl border border-gray-100 bg-gray-50 space-y-5">
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Open Now
            </div>
            {[
              { icon: FaMapMarkerAlt, label: "Address", value: "123 Digital Avenue, Osu, Accra, Ghana" },
              { icon: FaClock, label: "Hours", value: "Mon–Fri: 9AM–6PM · Sat: 10AM–4PM · Sun: Closed" },
              { icon: FaPhone, label: "Phone", href: "tel:+233000000000", value: "+233 (0) 00 000 0000" },
              { icon: FaEnvelope, label: "Email", href: "mailto:hello@eazworld.com", value: "hello@eazworld.com" },
            ].map(({ icon: Ic, label, value, href }) => (
              <div key={label} className="flex items-start gap-3 text-sm">
                <Ic className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">{label}</p>
                  {href ? <a href={href} className="text-gray-700 hover:text-gray-900 transition">{value}</a> : <p className="text-gray-700">{value}</p>}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              <a href="https://maps.google.com/?q=Osu+Accra+Ghana" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition">Get Directions</a>
              <a href="tel:+233000000000" className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition">Call Ahead</a>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-gray-100">
            <iframe
              title="EazWorld Office"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.9985423086!2d-0.18416!3d5.55302!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9084b2e7c8e5%3A0x57e19c8e55f1a94a!2sOsu%2C%20Accra%2C%20Ghana!5e0!3m2!1sen!2s!4v1234567890"
              width="100%" height="100%" style={{ border: 0, minHeight: "320px", display: "block" }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* AMENITIES */}
      <section className="py-16 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Our Space</p>
          <h2 className="font-display font-bold text-2xl text-gray-900 mb-8">Comfortable & Professional</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {amenities.map((a) => (
              <div key={a.label} className="flex items-center gap-2 p-4 rounded-xl bg-white border border-gray-100 text-sm text-gray-700">
                <a.icon className="text-amber-500 flex-shrink-0" size={14} />
                {a.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT TO EXPECT */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-7 rounded-2xl border border-amber-50 bg-amber-50">
            <h3 className="font-semibold text-gray-900 mb-2">For a Digital Consultation</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Sit down with one of our strategists for a free 30-minute session. We&apos;ll discuss your goals and give honest recommendations — no pressure.</p>
          </div>
          <div className="p-7 rounded-2xl border border-cyan-50 bg-cyan-50">
            <h3 className="font-semibold text-gray-900 mb-2">For Phone Repair</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Walk in, hand over your device, and our technician will assess it in minutes. Free quote before we start. Most repairs done while you wait.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Reviews</p>
          <h2 className="font-display font-bold text-2xl text-gray-900 mb-8">What Visitors Say</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-white border border-gray-100">
                <p className="text-amber-400 text-sm mb-3">{"★".repeat(5)}</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                <p className="text-gray-400 text-xs">{t.service}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
          <div className="p-7 rounded-2xl border border-gray-100 bg-gray-50 text-center">
            <h3 className="font-display font-bold text-xl text-gray-900 mb-2">Book a Consultation</h3>
            <p className="text-gray-500 text-sm mb-5">Free 30-minute session — in person, phone, or video.</p>
            <Link href="/book-consultation" className="block py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition">Book Now →</Link>
          </div>
          <div className="p-7 rounded-2xl border border-cyan-100 bg-cyan-50 text-center">
            <h3 className="font-display font-bold text-xl text-gray-900 mb-2">Phone Repair Walk-In</h3>
            <p className="text-gray-500 text-sm mb-5">No appointment needed. Walk in and we&apos;ll assess your device right away.</p>
            <Link href="/services/phone-repair" className="block py-3 rounded-full bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 transition">Learn About Repairs →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
