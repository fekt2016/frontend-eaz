"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Smartphone, BatteryFull, Wrench, Droplet, Cpu, Laptop, ArrowUp, Stethoscope, CheckCircle2, ChevronDown, ChevronUp, MapPin, Clock, Phone, Apple } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const brands = [
  { name: "iPhone",   initial: Apple, bg: "bg-gray-900",   text: "text-white",          border: "border-gray-700" },
  { name: "Samsung",  initial: "S",  bg: "bg-blue-600",   text: "text-white",          border: "border-blue-500" },
  { name: "Infinix",  initial: "X",  bg: "bg-red-600",    text: "text-white",          border: "border-red-500" },
  { name: "Tecno",    initial: "T",  bg: "bg-cyan-600",   text: "text-white",          border: "border-cyan-500" },
  { name: "Itel",     initial: "i",  bg: "bg-green-600",  text: "text-white",          border: "border-green-500" },
  { name: "Huawei",   initial: "H",  bg: "bg-rose-600",   text: "text-white",          border: "border-rose-500" },
  { name: "Nokia",    initial: "N",  bg: "bg-blue-800",   text: "text-white",          border: "border-blue-700" },
  { name: "Xiaomi",   initial: "Mi", bg: "bg-orange-500", text: "text-white",          border: "border-orange-400" },
];

const phoneGallery = [
  // iPhone & iPhone parts
  { src: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&h=500&fit=crop", alt: "iPhone", label: "iPhone", featured: true },
  { src: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=400&fit=crop", alt: "iPhone device", label: "iPhone" },
  { src: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=400&fit=crop", alt: "iPhone teardown parts", label: "iPhone Parts" },
  { src: "https://images.unsplash.com/photo-1574755393849-623942496936?w=600&h=400&fit=crop", alt: "iPhone screen assembly", label: "iPhone Screen" },
  { src: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&h=400&fit=crop", alt: "iPhone logic board", label: "iPhone Logic Board" },
  { src: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600&h=400&fit=crop", alt: "iPhone battery", label: "iPhone Battery" },
  // General phone parts
  { src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop", alt: "Phone motherboard circuit board", label: "Motherboard" },
  { src: "https://images.unsplash.com/photo-1581092921461-eab10380f87b?w=600&h=400&fit=crop", alt: "Soldering board-level repair", label: "Board Repair" },
  { src: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=600&h=400&fit=crop", alt: "Phone repair tools", label: "Repair Tools" },
];

const repairs = [
  { icon: Smartphone, title: "Screen Repair", desc: "Cracked or dead display? We replace screens for all major brands.", time: "1–2 hrs", price: "GHS 150–400", warranty: "30 days" },
  { icon: BatteryFull, title: "Battery Replacement", desc: "Battery draining fast? We replace it with a quality part.", time: "30 min", price: "GHS 80–200", warranty: "30 days" },
  { icon: Wrench, title: "Charging Port", desc: "Not charging or loose connection? We repair or replace the port.", time: "1–2 hrs", price: "GHS 100–250", warranty: "30 days" },
  { icon: Droplet, title: "Water Damage", desc: "Dropped in water? We disassemble, dry, and treat corrosion.", time: "24–48 hrs", price: "GHS 100–300", warranty: "No guarantee" },
  { icon: Cpu, title: "Board-Level Repair", desc: "Complex hardware faults and IC failures — we go deep.", time: "24–48 hrs", price: "GHS 200–800", warranty: "30 days" },
  { icon: Laptop, title: "Software Issues", desc: "Boot loops, malware, factory reset — fixed quickly.", time: "1–2 hrs", price: "GHS 50–150", warranty: "N/A" },
  { icon: ArrowUp, title: "Hardware Upgrades", desc: "Storage expansion and hardware modifications for compatible devices.", time: "2–4 hrs", price: "GHS 150–500", warranty: "30 days" },
  { icon: Stethoscope, title: "Diagnostics", desc: "Not sure what&apos;s wrong? Free honest assessment.", time: "30 min", price: "GHS 30–50", warranty: "N/A" },
];

const steps = [
  { num: "01", title: "Walk In", desc: "No appointment needed. Visit our Accra office during business hours." },
  { num: "02", title: "Diagnostic", desc: "Free assessment in minutes. Honest quote before any work begins." },
  { num: "03", title: "Repair", desc: "Quality parts, skilled technicians. Most repairs done while you wait." },
  { num: "04", title: "Pick Up", desc: "Tested in front of you, cleaned, and ready to go." },
];

const faqs = [
  { q: "Do you repair all brands?", a: "Yes — iPhone, Samsung, Infinix, Tecno, Itel, Huawei, Nokia, Xiaomi, and more." },
  { q: "How long do repairs take?", a: "Most repairs take 1–2 hours. Complex board-level repairs may take 24–48 hours." },
  { q: "Do you use original parts?", a: "We use high-quality OEM-grade parts. We'll tell you upfront if originals are available." },
  { q: "What if you can't fix it?", a: "You only pay the diagnostic fee (GHS 30–50). No hidden charges." },
  { q: "Is there a warranty?", a: "All hardware repairs come with a 30-day warranty — same issue recurs, we fix it free." },
  { q: "Do you offer data recovery?", a: "Yes. Success rates depend on the extent of damage." },
];

function FAQ({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
      {items.map((item, i) => (
        <div key={i} className="bg-white dark:bg-slate-900">
          <button type="button" onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left text-gray-900 dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition">
            {item.q}
            {open === i ? <ChevronUp size={12} className="text-gray-400 dark:text-slate-500 flex-shrink-0 ml-3" /> : <ChevronDown size={12} className="text-gray-400 dark:text-slate-500 flex-shrink-0 ml-3" />}
          </button>
          {open === i && <div className="px-6 pb-4 text-gray-500 dark:text-slate-400 text-sm leading-relaxed bg-white dark:bg-slate-900">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}

export default function PhoneRepair() {
  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white">

      {/* HERO */}
      <section className="pt-28 pb-16 px-4 border-b border-gray-100 dark:border-slate-800 bg-cyan-50 dark:bg-cyan-900/10">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 mb-4">Phone Repair · Accra</p>
            <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">Fast, Reliable Phone Repair in Accra</h1>
            <p className="text-gray-500 dark:text-slate-400 text-lg mb-6">iPhone, Samsung, Infinix, Tecno, Itel & more. Honest pricing. 30-day warranty. Walk-ins welcome.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/repair" className="px-6 py-3 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-brand-400 transition">Book a Repair Online</Link>
              <a href="tel:+233244388190" className="px-6 py-3 rounded-full bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 transition">Call Us Now</a>
              <a href="https://wa.me/233244388190" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition">
                <FaWhatsapp /> WhatsApp
              </a>
              <Link href="/visit-us" className="px-6 py-3 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-white dark:hover:bg-slate-800 transition">Find Our Office</Link>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-cyan-100 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Open — Mon–Fri 9AM–6PM · Sat 10AM–4PM
            </div>
            {[["Screen Repair", "1–2 hrs", "GHS 150–400"], ["Battery", "30 min", "GHS 80–200"], ["Charging Port", "1–2 hrs", "GHS 100–250"], ["Water Damage", "24 hrs", "GHS 100–300"]].map(([r, t, p]) => (
              <div key={r} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800 last:border-0 text-sm">
                <span className="text-gray-700 dark:text-slate-300">{r}</span>
                <div className="text-right"><span className="text-cyan-600 font-medium">{p}</span><span className="text-gray-400 ml-2 text-xs">· {t}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRANDS WE REPAIR */}
      <section className="py-16 px-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 mb-3">Brands</p>
          <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-8">Brands We Repair</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {brands.map((brand) => (
              <div key={brand.name} className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:-translate-y-0.5 transition duration-200">
                <div className={`w-12 h-12 rounded-xl ${brand.bg} ${brand.border} border flex items-center justify-center`}>
                  {typeof brand.initial === "string"
                    ? <span className={`font-display font-black text-base ${brand.text}`}>{brand.initial}</span>
                    : <brand.initial size={18} className={brand.text} />}
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 text-center">{brand.name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">+ Many more brands. If your phone isn&apos;t listed, call or WhatsApp us to check.</p>
        </div>
      </section>

      {/* PHONE GALLERY */}
      <section className="py-16 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 mb-3">Parts & Repairs</p>
          <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">What We Work With</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">iPhone, Samsung, Infinix, Tecno, Itel and more — screens, batteries, logic boards, cameras and charging ports.</p>

          {/* iPhone row */}
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">iPhone</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {phoneGallery.filter(img => img.label.startsWith("iPhone")).map((img, i) => (
              <div key={i} className={`relative overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 group ${i === 0 ? "sm:col-span-2 aspect-[16/9]" : "aspect-square"}`}>
                <Image src={img.src} alt={img.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-3 left-3 text-xs font-semibold text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">{img.label}</span>
              </div>
            ))}
          </div>

          {/* General parts row */}
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">Parts & Tools</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {phoneGallery.filter(img => !img.label.startsWith("iPhone")).map((img, i) => (
              <div key={i} className={`relative overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 group ${i === 0 ? "sm:col-span-2 aspect-[16/9]" : "aspect-square"}`}>
                <Image src={img.src} alt={img.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-3 left-3 text-xs font-semibold text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">{img.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REPAIRS */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">Services</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-10">What We Repair</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {repairs.map((r) => (
              <div key={r.title} className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-cyan-100 dark:hover:border-cyan-900/30 hover:shadow-sm transition">
                <r.icon size={20} className="text-cyan-500 mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{r.title}</h3>
                <p className="text-gray-400 dark:text-slate-500 text-xs leading-relaxed mb-3">{r.desc}</p>
                <div className="space-y-0.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-400 dark:text-slate-500">Price</span><span className="text-cyan-600 font-medium">{r.price}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 dark:text-slate-500">Time</span><span className="text-gray-600 dark:text-slate-400">{r.time}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 dark:text-slate-500">Warranty</span><span className="text-gray-600 dark:text-slate-400">{r.warranty}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TABLE */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">Pricing</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-3">Price Guide</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Free diagnostic before any repair. You approve the quote first.</p>
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="min-w-[540px] w-full text-sm">
              <thead className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
                <tr>{["Repair", "Price Range", "Turnaround", "Warranty"].map((h) => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 dark:text-slate-500">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {[["Screen Repair","GHS 150–400","1–2 hours","30 days"],["Battery","GHS 80–200","30 minutes","30 days"],["Charging Port","GHS 100–250","1–2 hours","30 days"],["Water Damage","GHS 100–300","24–48 hours","No guarantee"],["Board-Level","GHS 200–800","24–48 hours","30 days"],["Software","GHS 50–150","1–2 hours","N/A"],["Diagnostics","GHS 30–50","30 minutes","N/A"]].map(([r,p,t,w]) => (
                  <tr key={r}>
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{r}</td>
                    <td className="px-5 py-3 text-cyan-600 font-semibold">{p}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{t}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-slate-400">{w}</td>
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
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">Process</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-cyan-100 dark:border-cyan-900/30 bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center font-display font-bold text-cyan-600 mx-auto mb-3">{s.num}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">{s.title}</h3>
                <p className="text-gray-400 dark:text-slate-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">FAQ</p>
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-6">Common Questions</h2>
          <FAQ items={faqs} />
        </div>
      </section>

      {/* LOCATION */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-7 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">Visit Our Office</h2>
            {[
              { icon: MapPin, label: "Address", value: "E1/12 Nima, Alwaleed bin Talal Highway, Nima, Accra" },
              { icon: Clock, label: "Hours", value: "Mon–Fri: 9AM–6PM · Sat: 10AM–4PM · Sun: Closed" },
              { icon: Phone, label: "Phone", value: "+233 24 438 8190 / +233 23 522 2207", href: "tel:+233244388190" },
            ].map(({ icon: Ic, label, value, href }) => (
              <div key={label} className="flex items-start gap-3 text-sm">
                <Ic className="text-brand-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-xs mb-0.5">{label}</p>
                  {href ? <a href={href} className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition">{value}</a> : <p className="text-gray-500 dark:text-slate-400">{value}</p>}
                </div>
              </div>
            ))}
            <a href="https://wa.me/233244388190" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition">
              <FaWhatsapp className="text-emerald-500" size={18} />
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">WhatsApp Us</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-500">+233 24 438 8190</p>
              </div>
            </a>
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2 w-fit">
              <CheckCircle2 size={11} /> Walk-ins welcome — no appointment needed
            </div>
            <Link href="/visit-us" className="block text-center py-2.5 rounded-full border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 text-sm hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white transition">Get Directions →</Link>
          </div>
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-900/30 text-center">
              <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Ready to Fix Your Phone?</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-5">Book online in 2 minutes, walk in, or reach us directly.</p>
              <Link href="/repair" className="block py-3 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-brand-400 transition mb-2">Book a Repair Online</Link>
              <a href="tel:+233244388190" className="block py-3 rounded-full bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 transition mb-2">Call Now — +233 24 438 8190</a>
              <a href="https://wa.me/233244388190" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition mb-2">
                <FaWhatsapp /> WhatsApp Us
              </a>
              <Link href="/visit-us" className="block py-3 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm hover:bg-white dark:hover:bg-slate-800 transition">Get Directions</Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
