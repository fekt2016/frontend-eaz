"use client";

import { useState } from "react";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { sanitizeName, sanitizeEmail, sanitizeText, sanitizeMessage } from "@/lib/sanitize";

const schema = z.object({
  name:    z.string().min(1, "Name is required"),
  email:   z.string().email("Invalid email address"),
  subject: z.string().optional(),
  message: z.string().min(10, "Please write at least 10 characters"),
});

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition bg-white dark:bg-slate-800";

export default function ContactForm() {
  const [fields, setFields] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors]  = useState({});
  const [status, setStatus]  = useState("idle"); // idle | loading | success | error

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = {
      name:    sanitizeName(fields.name),
      email:   sanitizeEmail(fields.email),
      subject: sanitizeText(fields.subject, 200),
      message: sanitizeMessage(fields.message),
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
          name:    clean.name,
          email:   clean.email,
          subject: clean.subject || undefined,
          message: clean.message,
          type:    "general",
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setFields({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={24} className="text-emerald-500" />
        </div>
        <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">Message Sent!</h3>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-5">We&apos;ll get back to you within 24 hours.</p>
        <button
          onClick={() => setStatus("idle")}
          className="px-5 py-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <input type="text" value={fields.name} onChange={set("name")} placeholder="Your name" className={inputCls} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <input type="email" value={fields.email} onChange={set("email")} placeholder="Email address" className={inputCls} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
      </div>

      <div>
        <input type="text" value={fields.subject} onChange={set("subject")} placeholder="Subject (optional)" className={inputCls} />
      </div>

      <div>
        <textarea value={fields.message} onChange={set("message")} placeholder="How can we help you?" rows={5} className={inputCls} />
        {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 font-semibold hover:bg-gray-700 dark:hover:bg-brand-400 disabled:opacity-50 transition text-sm"
      >
        {status === "loading" ? "Sending…" : "Send Message →"}
      </button>

      {status === "error" && (
        <p className="text-red-500 text-xs text-center">
          Something went wrong. Email us at{" "}
          <a href="mailto:info@eazworld.co" className="underline">info@eazworld.co</a>
        </p>
      )}

      <p className="text-gray-400 dark:text-slate-500 text-xs text-center">
        We respond within 24 hours. Your info is never shared.
      </p>
    </form>
  );
}
