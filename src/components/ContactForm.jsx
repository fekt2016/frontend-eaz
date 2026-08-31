"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { sanitizeName, sanitizeEmail, sanitizeText, sanitizeMessage } from "@/lib/sanitize";

const schema = z.object({
  name:    z.string().min(1, "Name is required"),
  email:   z.string().email("Invalid email address"),
  subject: z.string().optional(),
  message: z.string().min(10, "Please write at least 10 characters"),
});

export default function ContactForm() {
  const [fields, setFields] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors]  = useState({});
  const [status, setStatus]  = useState("idle"); // idle | loading | success | error

  // Let a page hand the visitor a subject line — the VPS cards on /hosting link
  // here with ?subject=… because a VPS is quoted by hand, not bought online, and
  // arriving at a blank form loses what they were actually asking about.
  // Read from window rather than useSearchParams(): this component renders inside
  // statically-prerendered pages, where useSearchParams() demands a Suspense
  // boundary around every one of them.
  useEffect(() => {
    const subject = new URLSearchParams(window.location.search).get("subject");
    if (subject) setFields((f) => (f.subject ? f : { ...f, subject: subject.slice(0, 200) }));
  }, []);

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
      // role="status" so the confirmation is announced; the form it replaces
      // disappears, which a screen reader would otherwise report as nothing.
      <div className="text-center py-10" role="status">
        <div className="w-14 h-14 rounded-full bg-success-surface dark:bg-success-surface-dark flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={24} aria-hidden="true" className="text-success dark:text-success-dark" />
        </div>
        <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">Message sent</h3>
        <p className="text-body-sm text-gray-600 dark:text-slate-400 mb-5">
          We&apos;ll reply within 24 hours.
        </p>
        <Button variant="secondary" onClick={() => setStatus("idle")}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Your name"
          required
          type="text"
          value={fields.name}
          onChange={set("name")}
          error={errors.name}
          autoComplete="name"
          placeholder="Kwame Mensah"
        />
        <Input
          label="Email address"
          required
          type="email"
          value={fields.email}
          onChange={set("email")}
          error={errors.email}
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>

      <Input
        label="Subject"
        type="text"
        value={fields.subject}
        onChange={set("subject")}
        hint="Optional — helps us route your message."
        placeholder="Website redesign"
      />

      <Textarea
        label="How can we help?"
        required
        rows={5}
        value={fields.message}
        onChange={set("message")}
        error={errors.message}
        placeholder="Tell us what you're trying to build or fix."
      />

      <Button type="submit" size="lg" fullWidth loading={status === "loading"}>
        {status === "loading" ? "Sending…" : "Send message"}
      </Button>

      {status === "error" && (
        <p role="alert" className="text-body-sm font-medium text-error dark:text-error-dark text-center">
          That didn&apos;t send. Email us at{" "}
          <a href="mailto:info@eazworld.co" className="underline">info@eazworld.co</a>
        </p>
      )}

      <p className="text-caption text-gray-600 dark:text-slate-400 text-center">
        We respond within 24 hours. Your info is never shared.
      </p>
    </form>
  );
}
