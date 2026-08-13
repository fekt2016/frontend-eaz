"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import PageLoadingFallback from "@/components/common/PageLoadingFallback";
import { FaEnvelope, FaRedo } from "react-icons/fa";

function VerifyPageInner() {
  const { setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handlePinChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // On backspace, clear current and focus previous
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newPin = [...pin];
    pasted.split("").forEach((digit, i) => { newPin[i] = digit; });
    setPin(newPin);
    // Focus last filled input
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const code = pin.join("");
    if (code.length !== 6) { setError("Please enter the complete 6-digit code."); return; }
    if (!email) { setError("Email is required."); return; }

    setLoading(true);
    try {
      const res = await api.post("/auth/verify-pin", { email, pin: code });
      // Backend logs the user in and returns token + user
      if (res.data?.user) {
        setUser(res.data.user);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid or expired code. Please try again.");
      // Clear PIN on error
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { setError("Please enter your email address."); return; }
    setResendLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/auth/resend-pin", { email });
      setSuccess("A new code has been sent to your email.");
      setResendCooldown(60); // 60 second cooldown
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || "Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const pinComplete = pin.every((d) => d !== "");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-black text-2xl text-gray-900 dark:text-white">EazWorld</Link>
          <div className="mt-6 mb-4 flex justify-center">
            <span className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center">
              <FaEnvelope size={24} className="text-brand-500" />
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">Check your email</h1>
          <p className="text-gray-400 dark:text-slate-500 text-sm">
            We sent a 6-digit code to{" "}
            {email ? <strong className="text-gray-700 dark:text-slate-300">{email}</strong> : "your email address"}
          </p>
        </div>

        <div className="p-8 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email field (if not pre-filled) */}
            {!emailFromQuery && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 transition bg-white dark:bg-slate-800"
                  required
                />
              </div>
            )}

            {/* PIN inputs */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-3 text-center">Enter verification code</label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none transition
                      ${digit ? "border-brand-400 bg-brand-50" : "border-gray-200 dark:border-slate-700"}
                      focus:border-brand-400`}
                  />
                ))}
              </div>
            </div>

            {/* Error / Success */}
            {error   && <p className="text-red-500 text-sm text-center">{error}</p>}
            {success && <p className="text-emerald-600 text-sm text-center">{success}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !pinComplete}
              className="w-full py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm disabled:opacity-50">
              {loading ? "Verifying…" : "Verify Email →"}
            </button>

            {/* Resend */}
            <div className="text-center">
              <p className="text-sm text-gray-400 dark:text-slate-500 mb-2">Didn&apos;t receive the code?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:text-brand-600 disabled:opacity-50 transition">
                <FaRedo size={11} className={resendLoading ? "animate-spin" : ""} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-400 dark:text-slate-500 mt-5">
            Wrong account?{" "}
            <Link href="/auth/register" className="text-brand-500 font-medium hover:underline">Register again</Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <VerifyPageInner />
    </Suspense>
  );
}
