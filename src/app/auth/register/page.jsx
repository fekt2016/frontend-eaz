"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import PageLoadingFallback from "@/components/common/PageLoadingFallback";
import { sanitizeName, sanitizeEmail, sanitizePhone } from "@/lib/sanitize";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
});

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 transition bg-white dark:bg-slate-800";

function RegisterPageInner() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (!agreed) { setError("You must agree to the terms and conditions."); return; }
    const cleanName  = sanitizeName(name);
    const cleanEmail = sanitizeEmail(email);
    const cleanPhone = sanitizePhone(phone);
    const result = schema.safeParse({ name: cleanName, email: cleanEmail, phone: cleanPhone, password });
    if (!result.success) { setError("Invalid input. Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await register(cleanName, cleanEmail, cleanPhone, password);
      // If account requires verification, redirect to verify page
      if (res?.requiresVerification) {
        router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-black text-2xl text-gray-900 dark:text-white">EazWorld</Link>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mt-6 mb-1">Create your account</h1>
          <p className="text-gray-400 dark:text-slate-500 text-sm">Join thousands of businesses in Accra</p>
        </div>

        <div className="p-8 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Phone number <span className="text-gray-400 dark:text-slate-500">(optional)</span></label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 00 000 0000" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" className={`${inputCls} pr-12`} required />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition" aria-label={showPassword ? "Hide" : "Show"}>
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Confirm password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" className={`${inputCls} pr-12`} required />
                <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition" aria-label={showConfirmPassword ? "Hide" : "Show"}>
                  {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-600 dark:text-slate-400">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-gray-400" />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="text-amber-500 hover:underline">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-amber-500 hover:underline">Privacy Policy</Link>
              </span>
            </label>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm disabled:opacity-60">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-5">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-amber-500 font-medium hover:underline">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <RegisterPageInner />
    </Suspense>
  );
}
