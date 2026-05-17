"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { z } from "zod";
import { FaCheckCircle, FaWhatsapp, FaClock, FaStar, FaShieldAlt, FaArrowRight } from "react-icons/fa";
import { sanitizeName, sanitizeEmail, sanitizePhone, sanitizeText, sanitizeMessage } from "@/lib/sanitize";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  company: z.string().optional(),
  service: z.string().min(1, "Please select a service"),
  message: z.string().min(10, "Please share a bit more detail"),
});

const services = [
  { id: "Web Design & Development", label: "Web Design", icon: "🌐", desc: "Website or web app" },
  { id: "SEO & Content", label: "SEO & Content", icon: "📈", desc: "Rank higher on Google" },
  { id: "Paid Advertising", label: "Paid Ads", icon: "🎯", desc: "Facebook, Google ads" },
  { id: "Branding & Identity", label: "Branding", icon: "✨", desc: "Logo & brand identity" },
  { id: "Social Media", label: "Social Media", icon: "📱", desc: "Grow your audience" },
  { id: "Email Marketing", label: "Email Marketing", icon: "📧", desc: "Campaigns & automation" },
  { id: "Web Hosting", label: "Hosting", icon: "☁️", desc: "Fast & reliable hosting" },
  { id: "Not sure — need advice", label: "Not Sure Yet", icon: "💬", desc: "Let's figure it out" },
];

const trust = [
  { icon: <FaStar className="text-amber-400" />, value: "4.9/5", label: "Client Rating" },
  { icon: <FaClock className="text-amber-400" />, value: "< 24hrs", label: "Response Time" },
  { icon: <FaShieldAlt className="text-amber-400" />, value: "No Pressure", label: "Honest Advice" },
];

const steps = [
  { n: "01", t: "Book your spot", d: "Fill the form — 2 minutes." },
  { n: "02", t: "We confirm a time", d: "Within 24 hrs, we send 2–3 slots." },
  { n: "03", t: "30-minute call", d: "Discuss goals, get honest advice." },
  { n: "04", t: "Clear next steps", d: "Plan, timeline & cost estimate." },
];


const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition bg-white dark:bg-slate-800";

export default function BookConsultation() {
  const [fields, setFields] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", service: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch("/api/v1/reviews")
      .then((r) => r.json())
      .then((json) => setReviews((json.data || []).slice(0, 2)))
      .catch(() => setReviews([]));
  }, []);

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));
  const setService = (s) => setFields((f) => ({ ...f, service: s }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = {
      firstName: sanitizeName(fields.firstName),
      lastName:  sanitizeName(fields.lastName),
      email:     sanitizeEmail(fields.email),
      phone:     sanitizePhone(fields.phone),
      company:   sanitizeText(fields.company, 200),
      service:   fields.service,
      message:   sanitizeMessage(fields.message),
    };
    const result = schema.safeParse(clean);
    if (!result.success) {
      const errs = {};
      result.error.issues.forEach((i) => { errs[i.path[0]] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus("loading");
    try {
      const res = await fetch("/api/v1/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         `${clean.firstName} ${clean.lastName}`,
          email:        clean.email,
          phone:        clean.phone    || undefined,
          businessName: clean.company  || undefined,
          subject:      `Consultation: ${clean.service}`,
          service:      clean.service,
          type:         "consultation",
          message:      clean.message,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch { setStatus("error"); }
  };

  /* ── SUCCESS STATE ─────────────────────────────────────────── */
  if (status === "success") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4 pt-16">
        <div className="max-w-md w-full text-center p-10 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-5">
            <FaCheckCircle className="text-emerald-500 text-3xl" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">You&apos;re Booked In!</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
            We&apos;ve received your request. Expect a reply within 24 hours with 2–3 available time slots.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">What happens next?</p>
            <ul className="space-y-1.5">
              {["Check your email for our reply", "Pick a time slot that suits you", "Join the 30-min video or phone call", "Leave with a clear plan & estimate"].map((s) => (
                <li key={s} className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                  <FaCheckCircle className="text-amber-400 flex-shrink-0" size={10} /> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/" className="flex-1 px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition text-center">
              Back to Home
            </Link>
            <a href="https://wa.me/233244388190" target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition">
              <FaWhatsapp /> WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN PAGE ─────────────────────────────────────────────── */
  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white">

      {/* HERO ─────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-amber-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 px-3 py-1 rounded-full mb-5">
            Free · 30 Minutes · No Obligation
          </span>
          <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 dark:text-white mb-4 leading-tight">
            Let&apos;s Talk About<br />Your Business
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-8 max-w-lg mx-auto">
            Book a free 30-minute call. Get honest advice, a clear plan, and a realistic cost estimate — no sales pitch.
          </p>

          {/* Trust bar */}
          <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap">
            {trust.map(({ icon, value, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-base">{icon}</span>
                <div className="text-left">
                  <p className="font-bold text-gray-900 dark:text-white text-sm leading-none">{value}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM + SIDEBAR ──────────────────────────────────────── */}
      <section className="pb-24 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_320px] gap-8">

          {/* FORM CARD */}
          <div className="p-8 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-1">Tell Us About Your Project</h2>
            <p className="text-gray-400 dark:text-slate-500 text-sm mb-7">Takes 2 minutes. No spam, ever.</p>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">First name <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="Kwame" value={fields.firstName} onChange={set("firstName")} className={inputCls} />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Last name <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="Mensah" value={fields.lastName} onChange={set("lastName")} className={inputCls} />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Email address <span className="text-red-400">*</span></label>
                <input type="email" placeholder="you@example.com" value={fields.email} onChange={set("email")} className={inputCls} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Phone + Company */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Phone <span className="text-gray-300 dark:text-slate-600">(optional)</span></label>
                  <input type="tel" placeholder="+233 24 000 0000" value={fields.phone} onChange={set("phone")} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Company <span className="text-gray-300 dark:text-slate-600">(optional)</span></label>
                  <input type="text" placeholder="Your business" value={fields.company} onChange={set("company")} className={inputCls} />
                </div>
              </div>

              {/* Service — visual card picker */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">Which service are you interested in? <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setService(s.id)}
                      className={`flex flex-col items-center text-center p-3 rounded-xl border-2 transition text-xs font-medium gap-1 ${
                        fields.service === s.id
                          ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-gray-900 dark:text-white"
                          : "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500"
                      }`}
                    >
                      <span className="text-xl leading-none">{s.icon}</span>
                      <span className="font-semibold">{s.label}</span>
                      <span className="text-gray-400 dark:text-slate-500 text-[10px] leading-tight font-normal">{s.desc}</span>
                    </button>
                  ))}
                </div>
                {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service}</p>}
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                  Tell us about your project <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder="What's your business? What do you want to achieve? Any deadlines or budget in mind?"
                  value={fields.message}
                  onChange={set("message")}
                  rows={4}
                  className={inputCls}
                />
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-4 rounded-full bg-gray-900 dark:bg-amber-500 text-white dark:text-gray-900 font-bold text-sm hover:bg-gray-700 dark:hover:bg-amber-400 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                ) : (
                  <>Book My Free Consultation <FaArrowRight size={12} /></>
                )}
              </button>

              {status === "error" && (
                <p className="text-red-500 text-xs text-center">
                  Something went wrong. Email us at{" "}
                  <a href="mailto:info@eazworld.co" className="underline">info@eazworld.co</a>
                </p>
              )}

              <p className="text-gray-400 dark:text-slate-500 text-xs text-center">
                🔒 Your info is never shared. We respond within 24 hours.
              </p>
            </form>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-5">

            {/* What to expect */}
            <div className="p-6 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-4">What to Expect</p>
              <div className="space-y-4">
                {steps.map(({ n, t, d }) => (
                  <div key={n} className="flex gap-3">
                    <span className="font-display font-black text-gray-100 dark:text-slate-800 text-lg w-7 flex-shrink-0 leading-none mt-0.5">{n}</span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{t}</p>
                      <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5 leading-relaxed">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live testimonials from DB */}
            {reviews.length > 0 && (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <blockquote key={r._id} className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <div className="flex gap-0.5 mb-2">
                      {[1,2,3,4,5].map((s) => <FaStar key={s} size={11} className={s <= r.rating ? "text-amber-400" : "text-gray-200 dark:text-slate-700"} />)}
                    </div>
                    <p className="text-gray-600 dark:text-slate-300 text-xs italic leading-relaxed mb-3">&ldquo;{r.review}&rdquo;</p>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs flex-shrink-0">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{r.name}</p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500">{r.service}</p>
                      </div>
                    </div>
                  </blockquote>
                ))}
                <Link href="/reviews" className="block text-center text-xs text-amber-500 hover:text-amber-600 transition font-medium">
                  View all reviews →
                </Link>
              </div>
            )}

            {/* Direct contact */}
            <div className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 mb-3">Prefer to reach us directly?</p>
              <a href="mailto:info@eazworld.co" className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition mb-2">
                <span className="text-base">✉️</span> info@eazworld.co
              </a>
              <a href="tel:+233244388190" className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition mb-3">
                <span className="text-base">📞</span> +233 24 438 8190
              </a>
              <a
                href="https://wa.me/233244388190"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
              >
                <FaWhatsapp /> Chat on WhatsApp
              </a>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
