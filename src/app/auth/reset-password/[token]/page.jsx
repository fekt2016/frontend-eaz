"use client";

import { useState } from "react";
import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";
import { z } from "zod";

const schema = z.object({ password: z.string().min(8) });

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition bg-white";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = schema.safeParse({ password });
    if (!result.success) { setError("Password must be at least 8 characters."); return; }
    // TODO: PATCH /auth/reset-password/:token
    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-black text-2xl text-gray-900">EazWorld</Link>
          <h1 className="font-display font-bold text-2xl text-gray-900 mt-6 mb-1">Set new password</h1>
          <p className="text-gray-400 text-sm">Choose a strong password for your account</p>
        </div>

        <div className="p-8 rounded-2xl border border-gray-100 bg-gray-50">
          {success ? (
            <div className="text-center py-4">
              <FaCheckCircle className="text-emerald-500 text-3xl mx-auto mb-3" />
              <p className="font-semibold text-gray-900 mb-1">Password updated!</p>
              <p className="text-gray-500 text-sm">You can now sign in with your new password.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">New password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" className={inputCls} required />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" className="w-full py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm">
                Reset Password
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
