"use client";

import { Suspense, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import PageLoadingFallback from "@/components/common/PageLoadingFallback";
import { ShieldCheck } from "lucide-react";

function Verify2FAInner() {
  const { setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [pin, setPin]     = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  const handlePinChange = (i, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...pin]; next[i] = digit; setPin(next);
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !pin[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...pin];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setPin(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = pin.join("");
    if (code.length !== 6) { setError("Please enter the complete 6-digit code."); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/auth/2fa/verify", { email, pin: code });
      if (res.data?.user) setUser(res.data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid or expired code.");
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-ink flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-bold text-2xl text-gray-900 dark:text-white">EazWorld</Link>
          <div className="mt-6 mb-4 flex justify-center">
            <span className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
              <ShieldCheck size={24} className="text-violet-500" />
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">Two-factor authentication</h1>
          <p className="text-gray-400 dark:text-slate-500 text-sm">
            We sent a code to <strong className="text-gray-700 dark:text-slate-300">{email}</strong>
          </p>
        </div>

        <div className="p-8 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-3 text-center">Enter 6-digit code</label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {pin.map((d, i) => (
                  <input key={i} ref={(el) => (inputRefs.current[i] = el)}
                    type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none transition
                      ${d ? "border-violet-400 bg-violet-50" : "border-gray-200 dark:border-slate-700"} focus:border-violet-400`}
                  />
                ))}
              </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading || pin.some(d => !d)}
              className="w-full py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm disabled:opacity-50">
              {loading ? "Verifying…" : "Verify & Sign in →"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 dark:text-slate-500 mt-5">
            <Link href="/auth/login" className="text-brand-500 font-medium hover:underline">← Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Verify2FAInner />
    </Suspense>
  );
}
