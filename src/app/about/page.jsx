import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About EazWorld | Digital Agency in Accra, Ghana",
  description:
    "EazWorld is a premium digital agency in Accra, Ghana. Web design, branding, SEO, hosting, and phone repair for African businesses.",
  path: "/about",
});

const values = [
  { title: "Quality First", desc: "We don't ship until we're proud of it. Every detail matters." },
  { title: "Real Impact", desc: "We measure success by the growth our clients actually achieve." },
  { title: "True Partnership", desc: "We're invested in your long-term success, not just the deliverable." },
  { title: "Always Innovating", desc: "We stay ahead so our clients benefit from what works now and next." },
];

const stats = [
  { value: "150+", label: "Sellers on Saiisai" },
  { value: "15k+", label: "Products Listed" },
  { value: "500+", label: "Daily Transactions" },
  { value: "4.7/5", label: "Client Rating" },
  { value: "5yr", label: "In Business" },
  { value: "200+", label: "Clients Served" },
];

const team = [
  { name: "Kwame Asante", title: "Founder & CEO", bio: "Passionate about building digital infrastructure that empowers African businesses to compete globally.", initials: "KA" },
  { name: "Ama Boateng", title: "Head of Development", bio: "Full-stack engineer with a love for clean architecture and products that scale.", initials: "AB" },
  { name: "Kofi Mensah", title: "Head of Design", bio: "Crafts experiences that feel intuitive, beautiful, and rooted in how real people think.", initials: "KM" },
  { name: "Abena Owusu", title: "Head of Growth", bio: "Drives measurable results through SEO, paid media, and data-driven marketing.", initials: "AO" },
];

const approach = [
  { num: "01", title: "Listen", desc: "We start by understanding your goals, constraints, and what success means to you." },
  { num: "02", title: "Research", desc: "We analyse your market and audience before recommending a single solution." },
  { num: "03", title: "Design", desc: "We design experiences that are on-brand and built for conversion." },
  { num: "04", title: "Build", desc: "We develop with clean, maintainable code — fast, secure, and ready to scale." },
  { num: "05", title: "Launch", desc: "We handle go-live carefully, with testing and a smooth handover." },
  { num: "06", title: "Grow", desc: "After launch we keep optimising so results keep improving." },
];

export default function About() {
  return (
    <div className="bg-white text-gray-900">
      {/* HERO */}
      <section className="pt-28 pb-20 px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">Our Story</p>
          <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 mb-5">
            Built in Accra, Built for Africa.
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            EazWorld is a premium digital agency helping Ghanaian businesses build, grow, and compete in the digital economy.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto space-y-5 text-gray-600 leading-relaxed">
          <p>EazWorld was born from a simple observation: Ghanaian businesses had ambition, talent, and products that could compete anywhere — but lacked the digital infrastructure to reach their potential.</p>
          <p>So we built an agency that changes that. Not just a web shop, but a full-service digital partner that understands the local market and delivers work that moves the needle.</p>
          <p>Our biggest proof point is Saiisai — Ghana&apos;s emerging online marketplace that we built from the ground up. Starting with zero sellers, we designed the platform, built the technology, crafted the brand, and drove the marketing strategy that brought over 150 verified sellers and 15,000+ products to life.</p>
          <p>Today we serve businesses across Accra and beyond — from solo founders to growing teams — helping them build digital presences that convert, scale, and endure.</p>
        </div>
      </section>

      {/* MISSION + VISION */}
      <section className="py-20 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-white border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Mission</p>
            <p className="text-gray-700 leading-relaxed">To empower Ghanaian and African businesses with world-class digital solutions — making cutting-edge web design, marketing, and technology accessible and impactful.</p>
          </div>
          <div className="p-8 rounded-2xl bg-white border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Vision</p>
            <p className="text-gray-700 leading-relaxed">A thriving African digital ecosystem where innovation creates opportunity — where every local business can compete on a global stage.</p>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">What We Stand For</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 mb-10">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v) => (
              <div key={v.title} className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-amber-100 hover:shadow-sm transition">
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">By the Numbers</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 mb-10">The Work Speaks</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {stats.map((s) => (
              <div key={s.label} className="text-center p-5 rounded-2xl bg-white border border-gray-100">
                <p className="font-display font-bold text-2xl text-gray-900 mb-1">{s.value}</p>
                <p className="text-gray-400 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">The Team</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 mb-10">The People Behind the Work</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map((m) => (
              <div key={m.name} className="p-6 rounded-2xl border border-gray-100 bg-white">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center font-bold text-amber-600 mb-4">{m.initials}</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-0.5">{m.name}</h3>
                <p className="text-amber-500 text-xs font-medium mb-3">{m.title}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPROACH */}
      <section className="py-20 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">How We Work</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 mb-10">Our Approach</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {approach.map((s) => (
              <div key={s.num} className="flex gap-4">
                <span className="font-display font-bold text-2xl text-gray-200 flex-shrink-0 w-10">{s.num}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-bold text-3xl text-gray-900 mb-4">Ready to Build Something Together?</h2>
          <p className="text-gray-500 mb-8">Let&apos;s talk about your goals and how EazWorld can help.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm">Start a Conversation</Link>
            <Link href="/services" className="px-6 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition text-sm">Explore Services</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
