"use client";

import { useState } from "react";
import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";
import { api } from "@/lib/api";

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition bg-white";

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
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-black text-2xl text-gray-900">EazWorld</Link>
          <h1 className="font-display font-bold text-2xl text-gray-900 mt-6 mb-1">Reset your password</h1>
          <p className="text-gray-400 text-sm">Enter your email and we&apos;ll send a reset link</p>
        </div>

        <div className="p-8 rounded-2xl border border-gray-100 bg-gray-50">
          {sent ? (
            <div className="text-center py-4">
              <FaCheckCircle className="text-emerald-500 text-3xl mx-auto mb-3" />
              <p className="font-semibold text-gray-900 mb-1">Check your inbox</p>
              <p className="text-gray-500 text-sm">If that email exists in our system, we&apos;ve sent a reset link.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} required />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm disabled:opacity-60">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="text-center mt-5">
            <Link href="/auth/login" className="text-sm text-gray-400 hover:text-gray-700 transition">← Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
