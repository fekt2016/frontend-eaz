"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Star } from "lucide-react";
import { serviceDetails } from "@/data/serviceDetails";

function FAQ({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
      {items.map((item, i) => (
        <div key={i} className="bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left text-gray-900 dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            {item.q}
            {open === i ? <ChevronUp className="text-gray-400 dark:text-slate-500 flex-shrink-0 ml-3" size={12} /> : <ChevronDown className="text-gray-400 dark:text-slate-500 flex-shrink-0 ml-3" size={12} />}
          </button>
          {open === i && (
            <div className="px-6 pb-4 text-gray-500 dark:text-slate-400 text-sm leading-relaxed bg-white dark:bg-slate-900">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ServiceDetail({ slug }) {
  const service = serviceDetails.find((s) => s.slug === slug);
  if (!service) notFound();
  const Icon = service.icon;

  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white">
      {/* HERO */}
      <section className="pt-28 pb-16 px-4 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto">
          <Link href="/services" className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition mb-6 inline-block">← All Services</Link>
          <div className="grid md:grid-cols-[1fr_300px] gap-10 items-start">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-5">
                <Icon size={22} className="text-brand-500" />
              </div>
              <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 dark:text-white mb-4">{service.title}</h1>
              <p className="text-gray-500 dark:text-slate-400 text-lg leading-relaxed">{service.tagline}</p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex justify-between text-sm border-b border-gray-100 dark:border-slate-700 pb-3">
                <div><p className="text-gray-400 dark:text-slate-500 text-xs mb-1">Investment</p><p className="font-semibold text-gray-900 dark:text-white">{service.investment}</p></div>
                <div className="text-right"><p className="text-gray-400 dark:text-slate-500 text-xs mb-1">Timeline</p><p className="font-semibold text-gray-900 dark:text-white">{service.timeline}</p></div>
              </div>
              <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{service.description}</p>
              <Link href="/contact" className="block text-center py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition">
                Start This Project
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CHALLENGE */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">The Problem</p>
          <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">The Challenge</h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">{service.challenge}</p>
        </div>
      </section>

      {/* SOLUTION + PROCESS */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">Our Approach</p>
            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">How We Solve It</h2>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">{service.solution}</p>
          </div>
          <div className="space-y-3">
            {service.process.map((p, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="font-display font-bold text-gray-200 dark:text-slate-700 text-lg flex-shrink-0 w-7">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">{p.step}</h4>
                  <p className="text-gray-500 dark:text-slate-400 text-xs leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DELIVERABLES + CASE STUDY */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">What You Get</p>
            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">Deliverables</h2>
            <ul className="space-y-2.5">
              {service.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-slate-300">
                  <CheckCircle2 size={13} className="text-brand-500 mt-0.5 flex-shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-7 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">Real Example</p>
            <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-3">Saiisai Marketplace</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-5">{service.saiisaiExample}</p>
            <div className="flex gap-5 mb-5">
              {[["150+", "Sellers"], ["15k+", "Products"], ["4.7", "Rating", true]].map(([val, label, rating]) => (
                <div key={label}><p className="font-bold text-gray-900 dark:text-white">{val}{rating && <Star size={13} className="inline-block -mt-0.5 ml-1" />}</p><p className="text-gray-400 dark:text-slate-500 text-xs">{label}</p></div>
              ))}
            </div>
            <Link href="/portfolio/saiisai" className="text-brand-500 text-sm font-medium hover:underline">Read the full case study →</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500 mb-3">Questions</p>
          <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">Frequently Asked</h2>
          <FAQ items={service.faqs} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-3">Ready to Get Started?</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-7">Free consultation, no obligation. Let&apos;s talk about your project.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contact" className="px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition">Get a Free Quote</Link>
            <Link href="/book-consultation" className="px-6 py-3 rounded-full border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 text-sm font-medium hover:bg-white dark:hover:bg-slate-800 transition">Book a Consultation</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
