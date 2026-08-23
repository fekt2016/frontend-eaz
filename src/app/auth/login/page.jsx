"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import PageLoadingFallback from "@/components/common/PageLoadingFallback";
import { sanitizeEmail, sanitizePhone } from "@/lib/sanitize";
import { landingPathForRole } from "@/lib/roles";

const schema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 transition bg-white dark:bg-slate-800";

function LoginPageInner() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const cleanIdentifier = /\S+@\S+\.\S+/.test(email.trim())
      ? sanitizeEmail(email)
      : sanitizePhone(email);
    const result = schema.safeParse({ email: cleanIdentifier, password });
    if (!result.success) { setError("Invalid email/phone or password."); return; }
    setLoading(true);
    try {
      const res = await login(cleanIdentifier, password);
      // If 2FA required, redirect to 2FA verification page
      if (res?.data?.requiresTwoFactor) {
        router.push(`/auth/verify-2fa?email=${encodeURIComponent(cleanIdentifier)}`);
        return;
      }
      router.push(landingPathForRole(res?.data?.user?.role));
    } catch (err) {
      // If account not verified, redirect to verify page — a phone-only account
      // has no `err.email` (T17), so fall back to whichever identifier was
      // actually typed and pick the matching query param.
      if (err.requiresVerification) {
        const value = err.email || cleanIdentifier;
        const param = /\S+@\S+\.\S+/.test(value) ? "email" : "phone";
        router.push(`/auth/verify?${param}=${encodeURIComponent(value)}`);
        return;
      }
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-bold text-2xl text-gray-900 dark:text-white">EazWorld</Link>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mt-6 mb-1">Welcome back</h1>
          <p className="text-gray-400 dark:text-slate-500 text-sm">Sign in to your account</p>
        </div>

        <div className="p-8 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email or phone number</label>
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com or 024 000 0000" className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={`${inputCls} pr-12`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm disabled:opacity-60">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="flex items-center justify-between mt-5 text-xs">
            <Link href="/auth/forgot-password" className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition">Forgot password?</Link>
            <Link href="/auth/register" className="text-brand-500 font-medium hover:underline">Create account →</Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-6">
          By signing in you agree to our{" "}
          <Link href="/terms" className="hover:text-gray-700 dark:hover:text-slate-300 transition">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-slate-300 transition">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <LoginPageInner />
    </Suspense>
  );
}
