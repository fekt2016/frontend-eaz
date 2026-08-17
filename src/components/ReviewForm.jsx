"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { sanitizeName, sanitizeMessage } from "@/lib/sanitize";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  service: z.string().min(1, "Please select a service"),
  rating: z.number().min(1, "Please select a rating"),
  review: z.string().min(10, "Please write at least 10 characters"),
});

const services = [
  "Web Design & Development",
  "Phone Repair",
  "SEO & Content",
  "Web Hosting",
  "Domain Registration",
  "Paid Advertising",
  "Branding & Identity",
  "Social Media",
  "Other",
];

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 transition bg-white dark:bg-slate-800";

export default function ReviewForm({ onSuccess }) {
  const { user } = useAuth();
  const [fields, setFields] = useState({ name: "", service: "", rating: 0, review: "" });
  const [hovered, setHovered] = useState(0);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  // Pre-fill name when user logs in
  useEffect(() => {
    if (user?.name) setFields((f) => ({ ...f, name: user.name }));
  }, [user]);

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));
  const setRating = (r) => setFields((f) => ({ ...f, rating: r }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = {
      ...fields,
      name:   sanitizeName(fields.name),
      review: sanitizeMessage(fields.review, 2000),
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
      const res = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clean),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setFields({ name: "", service: "", rating: 0, review: "" });
      if (onSuccess) onSuccess();
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-4">⭐</div>
        <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Thank You!</h3>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-1">Your review has been submitted and is now live.</p>
        <p className="text-gray-400 dark:text-slate-500 text-xs mb-5">Refresh the page to see it in the reviews list.</p>
        <button onClick={() => setStatus("idle")} className="px-5 py-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-100 transition">
          Write Another Review
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Star Rating */}
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Your Rating <span className="text-red-500">*</span></p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                size={28}
                fill="currentColor"
                className={`transition-colors ${
                  star <= (hovered || fields.rating)
                    ? "text-brand-400"
                    : "text-gray-200 dark:text-slate-700"
                }`}
              />
            </button>
          ))}
        </div>
        {errors.rating && <p className="text-red-500 text-xs mt-1">{errors.rating}</p>}
      </div>

      {/* Name */}
      <div>
        <div className="relative">
          <input
            type="text"
            placeholder="Your name"
            value={fields.name}
            onChange={set("name")}
            readOnly={!!user?.name}
            className={`${inputCls} ${user?.name ? "bg-paper dark:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-default" : ""}`}
          />
          {user?.name && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-brand-500 font-medium">
              Logged in
            </span>
          )}
        </div>
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Service */}
      <div>
        <select value={fields.service} onChange={set("service")} className={`${inputCls} text-gray-500 dark:text-slate-400`}>
          <option value="">Which service did you use?</option>
          {services.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service}</p>}
      </div>

      {/* Review */}
      <div>
        <textarea
          placeholder="Share your experience with EazWorld..."
          value={fields.review}
          onChange={set("review")}
          rows={4}
          className={inputCls}
        />
        {errors.review && <p className="text-red-500 text-xs mt-1">{errors.review}</p>}
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 font-semibold hover:bg-gray-700 dark:hover:bg-brand-400 disabled:opacity-50 transition text-sm"
      >
        {status === "loading" ? "Submitting..." : "Submit Review →"}
      </button>

      {status === "error" && (
        <p className="text-red-500 text-xs text-center">Something went wrong. Please try again or contact us directly.</p>
      )}
    </form>
  );
}
