"use client";

import { useState } from "react";
import Link from "next/link";
import { FaMobileAlt, FaBatteryFull, FaTools, FaTint, FaMicrochip, FaLaptop, FaArrowUp, FaStethoscope, FaCheckCircle, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaClock, FaPhone } from "react-icons/fa";

const repairs = [
  { icon: FaMobileAlt, title: "Screen Repair", desc: "Cracked or dead display? We replace screens for all major brands.", time: "1–2 hrs", price: "GHS 150–400", warranty: "30 days" },
  { icon: FaBatteryFull, title: "Battery Replacement", desc: "Battery draining fast? We replace it with a quality part.", time: "30 min", price: "GHS 80–200", warranty: "30 days" },
  { icon: FaTools, title: "Charging Port", desc: "Not charging or loose connection? We repair or replace the port.", time: "1–2 hrs", price: "GHS 100–250", warranty: "30 days" },
  { icon: FaTint, title: "Water Damage", desc: "Dropped in water? We disassemble, dry, and treat corrosion.", time: "24–48 hrs", price: "GHS 100–300", warranty: "No guarantee" },
  { icon: FaMicrochip, title: "Board-Level Repair", desc: "Complex hardware faults and IC failures — we go deep.", time: "24–48 hrs", price: "GHS 200–800", warranty: "30 days" },
  { icon: FaLaptop, title: "Software Issues", desc: "Boot loops, malware, factory reset — fixed quickly.", time: "1–2 hrs", price: "GHS 50–150", warranty: "N/A" },
  { icon: FaArrowUp, title: "Hardware Upgrades", desc: "Storage expansion and hardware modifications for compatible devices.", time: "2–4 hrs", price: "GHS 150–500", warranty: "30 days" },
  { icon: FaStethoscope, title: "Diagnostics", desc: "Not sure what&apos;s wrong? Free honest assessment.", time: "30 min", price: "GHS 30–50", warranty: "N/A" },
];

const steps = [
  { num: "01", title: "Walk In", desc: "No appointment needed. Visit our Accra office during business hours." },
  { num: "02", title: "Diagnostic", desc: "Free assessment in minutes. Honest quote before any work begins." },
  { num: "03", title: "Repair", desc: "Quality parts, skilled technicians. Most repairs done while you wait." },
  { num: "04", title: "Pick Up", desc: "Tested in front of you, cleaned, and ready to go." },
];

const faqs = [
  { q: "Do you repair all brands?", a: "Yes — iPhone, Samsung, Tecno, Infinix, Huawei, Nokia, Xiaomi, and more." },
  { q: "How long do repairs take?", a: "Most repairs take 1–2 hours. Complex board-level repairs may take 24–48 hours." },
  { q: "Do you use original parts?", a: "We use high-quality OEM-grade parts. We'll tell you upfront if originals are available." },
  { q: "What if you can't fix it?", a: "You only pay the diagnostic fee (GHS 30–50). No hidden charges." },
  { q: "Is there a warranty?", a: "All hardware repairs come with a 30-day warranty — same issue recurs, we fix it free." },
  { q: "Do you offer data recovery?", a: "Yes. Success rates depend on the extent of damage." },
];

function FAQ({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
      {items.map((item, i) => (
        <div key={i} className="bg-white">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left text-gray-900 font-medium text-sm hover:bg-gray-50 transition"
          >
            {item.q}
            {open === i ? <FaChevronUp size={12} className="text-gray-400 flex-shrink-0 ml-3" /> : <FaChevronDown size={12} className="text-gray-400 flex-shrink-0 ml-3" />}
          </button>
          {open === i && <div className="px-6 pb-4 text-gray-500 text-sm leading-relaxed bg-gray-50">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}

export default function PhoneRepair() {
  return (
    <div className="bg-white text-gray-900">
      {/* HERO */}
      <section className="pt-28 pb-16 px-4 border-b border-gray-100 bg-cyan-50">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 mb-4">Phone Repair · Accra</p>
            <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 mb-4">Fast, Reliable Phone Repair in Accra</h1>
            <p className="text-gray-500 text-lg mb-6">All major brands. Honest pricing. 30-day warranty. Walk-ins welcome.</p>
            <div className="flex flex-wrap gap-3">
              <a href="tel:+233000000000" className="px-6 py-3 rounded-full bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 transition">Call Us Now</a>
              <Link href="/visit-us" className="px-6 py-3 rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-white transition">Find Our Office</Link>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-cyan-100 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Open — Mon–Sat 9AM–6PM
            </div>
            {[["Screen Repair", "1–2 hrs", "GHS 150–400"], ["Battery", "30 min", "GHS 80–200"], ["Charging Port", "1–2 hrs", "GHS 100–250"], ["Water Damage", "24 hrs", "GHS 100–300"]].map(([r, t, p]) => (
              <div key={r} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                <span className="text-gray-700">{r}</span>
                <div className="text-right"><span className="text-cyan-600 font-medium">{p}</span><span className="text-gray-400 ml-2 text-xs">· {t}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REPAIRS */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Services</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 mb-10">What We Repair</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {repairs.map((r) => (
              <div key={r.title} className="p-5 rounded-2xl border border-gray-100 bg-white hover:border-cyan-100 hover:shadow-sm transition">
                <r.icon size={20} className="text-cyan-500 mb-3" />
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{r.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-3">{r.desc}</p>
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-400">Price</span><span className="text-cyan-600 font-medium">{r.price}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Time</span><span className="text-gray-600">{r.time}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Warranty</span><span className="text-gray-600">{r.warranty}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TABLE */}
      <section className="py-20 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Pricing</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 mb-3">Price Guide</h2>
          <p className="text-gray-500 text-sm mb-6">Free diagnostic before any repair. You approve the quote first.</p>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
            <table className="min-w-[540px] w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{["Repair", "Price Range", "Turnaround", "Warranty"].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[["Screen Repair","GHS 150–400","1–2 hours","30 days"],["Battery","GHS 80–200","30 minutes","30 days"],["Charging Port","GHS 100–250","1–2 hours","30 days"],["Water Damage","GHS 100–300","24–48 hours","No guarantee"],["Board-Level","GHS 200–800","24–48 hours","30 days"],["Software","GHS 50–150","1–2 hours","N/A"],["Diagnostics","GHS 30–50","30 minutes","N/A"]].map(([r,p,t,w]) => (
                  <tr key={r}>
                    <td className="px-5 py-3 font-medium text-gray-900">{r}</td>
                    <td className="px-5 py-3 text-cyan-600 font-semibold">{p}</td>
                    <td className="px-5 py-3 text-gray-500">{t}</td>
                    <td className="px-5 py-3 text-gray-500">{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Process</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-100 bg-cyan-50 flex items-center justify-center font-display font-bold text-cyan-600 mx-auto mb-3">{s.num}</div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{s.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">FAQ</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 mb-6">Common Questions</h2>
          <FAQ items={faqs} />
        </div>
      </section>

      {/* LOCATION */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-7 rounded-2xl border border-gray-100 bg-white space-y-4">
            <h2 className="font-display font-bold text-2xl text-gray-900 mb-1">Visit Our Office</h2>
            {[
              { icon: FaMapMarkerAlt, label: "Address", value: "123 Digital Avenue, Osu, Accra, Ghana" },
              { icon: FaClock, label: "Hours", value: "Mon–Sat: 9AM–6PM · Sunday: Closed" },
              { icon: FaPhone, label: "Phone", value: "+233 (0) 00 000 0000", href: "tel:+233000000000" },
            ].map(({ icon: Ic, label, value, href }) => (
              <div key={label} className="flex items-start gap-3 text-sm">
                <Ic className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-xs mb-0.5">{label}</p>
                  {href ? <a href={href} className="text-gray-500 hover:text-gray-900 transition">{value}</a> : <p className="text-gray-500">{value}</p>}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 w-fit">
              <FaCheckCircle size={11} /> Walk-ins welcome — no appointment needed
            </div>
            <Link href="/visit-us" className="block text-center py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm hover:border-gray-400 hover:text-gray-900 transition">Get Directions →</Link>
          </div>
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-cyan-50 border border-cyan-100 text-center">
              <h3 className="font-display font-bold text-xl text-gray-900 mb-2">Ready to Fix Your Phone?</h3>
              <p className="text-gray-500 text-sm mb-5">Walk in today or call ahead.</p>
              <a href="tel:+233000000000" className="block py-3 rounded-full bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 transition mb-2">Call Now</a>
              <Link href="/visit-us" className="block py-3 rounded-full border border-gray-300 text-gray-700 text-sm hover:bg-white transition">Get Directions</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
