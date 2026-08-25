"use client";

import { controlBase, controlSizes, controlBorder } from "@/components/ui/controlStyles";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { sanitizeEmail } from "@/lib/sanitize";

const inputCls = `${controlBase} ${controlSizes.md} ${controlBorder(false)}`;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: sanitizeEmail(email) });
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-bold text-2xl text-gray-900 dark:text-white">EazWorld</Link>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mt-6 mb-1">Reset your password</h1>
          <p className="text-gray-600 dark:text-slate-500 text-sm">Enter your email and we&apos;ll send a reset link</p>
        </div>

        <div className="p-8 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 size={30} className="text-emerald-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Check your inbox</p>
              <p className="text-gray-500 dark:text-slate-400 text-sm">If that email exists in our system, we&apos;ve sent a reset link.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} required />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm disabled:opacity-60">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="text-center mt-5">
            <Link href="/auth/login" className="text-sm text-gray-600 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition">← Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
