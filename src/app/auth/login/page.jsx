"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import PageLoadingFallback from "@/components/common/PageLoadingFallback";
import { sanitizeEmail, sanitizePhone } from "@/lib/sanitize";
import { landingPathForRole } from "@/lib/roles";
import { errorMessage } from "@/lib/api";
import { Button, Input, Field } from "@/components/ui";

const schema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

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
      setError(errorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" aria-label="EazWorld home">
            <Image src="/logo.png" alt="EazWorld" width={512} height={440} className="h-10 w-auto mx-auto" priority />
          </Link>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mt-6 mb-1">Welcome back</h1>
          <p className="text-gray-600 dark:text-slate-500 text-sm">Sign in to your account</p>
        </div>

        <div className="p-8 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email or phone number"
              required
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com or 024 000 0000"
              autoComplete="username"
            />

            <Field label="Password" required>
              {(fieldProps) => (
                <div className="relative">
                  <Input
                    bare
                    {...fieldProps}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                    className="pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </div>
              )}
            </Field>

            {error && (
              <p role="alert" className="text-body-sm font-medium text-error dark:text-error-dark">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" fullWidth loading={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="flex items-center justify-between mt-5 text-xs">
            <Link href="/auth/forgot-password" className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition">Forgot password?</Link>
            <Link href="/auth/register" className="text-brand-ink dark:text-brand-400 font-medium hover:underline">Create account →</Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 dark:text-slate-500 mt-6">
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