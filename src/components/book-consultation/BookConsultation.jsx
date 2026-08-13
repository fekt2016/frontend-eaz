"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { FaCheckCircle } from "react-icons/fa";

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
  "Web Design & Development", "SEO & Content", "Paid Advertising",
  "Branding & Identity", "Social Media", "Email Marketing",
  "Web Hosting", "Domain Registration", "Not sure — need advice",
];

const input = "w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition bg-white";

export default function BookConsultation() {
  const [fields, setFields] = useState({ firstName: "", lastName: "", email: "", phone: "", company: "", service: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = schema.safeParse(fields);
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
          name: `${fields.firstName} ${fields.lastName}`,
          email: fields.email,
          subject: `Consultation: ${fields.service}`,
          message: `Company: ${fields.company || "N/A"}\nPhone: ${fields.phone || "N/A"}\n\n${fields.message}`,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch { setStatus("error"); }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4 pt-16">
        <div className="max-w-md w-full text-center p-10 rounded-2xl border border-gray-100 bg-gray-50">
          <FaCheckCircle className="text-amber-500 text-4xl mx-auto mb-5" />
          <h1 className="font-display font-bold text-2xl text-gray-900 mb-3">Request Received</h1>
          <p className="text-gray-500 text-sm mb-6">We&apos;ll get back to you within 24 hours to confirm a time.</p>
          <Link href="/" className="px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-900">
      {/* HERO */}
      <section className="pt-28 pb-14 px-4 border-b border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-4">Free · 30 Minutes · No Obligation</p>
          <h1 className="font-display font-black text-4xl md:text-5xl text-gray-900 mb-4">Book a Free Consultation</h1>
          <p className="text-gray-500 text-lg">Tell us about your project and we&apos;ll schedule a call. Honest advice, no sales pressure.</p>
        </div>
      </section>

      {/* FORM + SIDEBAR */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_320px] gap-12">
          <div className="p-8 rounded-2xl border border-gray-100 bg-gray-50">
            <h2 className="font-display font-bold text-xl text-gray-900 mb-6">Tell Us About Your Project</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input type="text" placeholder="First name" value={fields.firstName} onChange={set("firstName")} className={input} />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <input type="text" placeholder="Last name" value={fields.lastName} onChange={set("lastName")} className={input} />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <input type="email" placeholder="Email address" value={fields.email} onChange={set("email")} className={input} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="tel" placeholder="Phone (optional)" value={fields.phone} onChange={set("phone")} className={input} />
                <input type="text" placeholder="Company (optional)" value={fields.company} onChange={set("company")} className={input} />
              </div>
              <div>
                <select value={fields.service} onChange={set("service")} className={`${input} text-gray-500`}>
                  <option value="">Which service interests you?</option>
                  {services.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service}</p>}
              </div>
              <div>
                <textarea placeholder="Tell us about your business and what you want to achieve..." value={fields.message} onChange={set("message")} rows={4} className={input} />
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
              </div>
              <button type="submit" disabled={status === "loading"} className="w-full py-3.5 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 disabled:opacity-50 transition text-sm">
                {status === "loading" ? "Sending..." : "Request My Free Consultation →"}
              </button>
              {status === "error" && <p className="text-red-500 text-xs text-center">Something went wrong. Email us at hello@eazworld.com</p>}
              <p className="text-gray-400 text-xs text-center">We respond within 24 hours. Your info is never shared.</p>
            </form>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">What to Expect</p>
              {[["01", "Submit this form", "2 minutes. Tell us about your project."], ["02", "We confirm a time", "Within 24 hours, we send 2–3 available slots."], ["03", "30-minute call", "We discuss your goals and what makes sense."], ["04", "Clear next steps", "Leave with a plan, timeline, and honest cost estimate."]].map(([n, t, d]) => (
                <div key={n} className="flex gap-3 mb-4">
                  <span className="font-display font-bold text-gray-200 text-base w-7 flex-shrink-0">{n}</span>
                  <div><p className="font-medium text-gray-900 text-sm">{t}</p><p className="text-gray-400 text-xs leading-relaxed">{d}</p></div>
                </div>
              ))}
            </div>

            <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-400 mb-2">Prefer to reach us directly?</p>
              <a href="mailto:hello@eazworld.com" className="block text-sm text-gray-700 hover:text-gray-900 transition">hello@eazworld.com</a>
              <a href="tel:+233000000000" className="block text-sm text-gray-700 hover:text-gray-900 transition mt-1">+233 (0) 00 000 0000</a>
            </div>

            <blockquote className="p-5 rounded-2xl border border-gray-100 bg-white">
              <p className="text-gray-500 text-sm italic leading-relaxed">&ldquo;The consultation helped us understand exactly what we needed. Site was live in days.&rdquo;</p>
              <p className="text-amber-500 text-xs font-medium mt-3">— A. Mensah, CEO TechStart</p>
            </blockquote>
          </div>
        </div>
      </section>
    </div>
  );
}
