"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FaUser, FaLock, FaShieldAlt, FaCheckCircle,
  FaTimesCircle, FaEye, FaEyeSlash, FaSpinner, FaMoon, FaSun,
} from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";
import { sanitizeName, sanitizePhone } from "@/lib/sanitize";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 dark:focus:border-slate-500 transition bg-white dark:bg-slate-800";

function Alert({ type, message }) {
  if (!message) return null;
  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
      {type === "success" ? <FaCheckCircle size={13} /> : <FaTimesCircle size={13} />}
      {message}
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, children, iconColor = "bg-gray-800" }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
      <div className="px-6 py-5 border-b border-gray-50 dark:border-slate-800 flex items-center gap-3">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={15} className="text-white" />
        </span>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h2>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────

function ProfileSection({ user, onUpdate }) {
  const [name, setName]   = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState({ type: "", message: "" });

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const res = await api.patch("/auth/me", { name: sanitizeName(name), phone: sanitizePhone(phone) });
      onUpdate(res.data?.user);
      setStatus({ type: "success", message: "Profile updated successfully." });
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard icon={FaUser} title="Profile Information" description="Update your name and phone number." iconColor="bg-blue-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Full name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Email address</label>
          <input type="email" value={user?.email || ""} disabled className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone number <span className="text-gray-400">(optional)</span></label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 00 000 0000" className={inputCls} />
        </div>
        <Alert type={status.type} message={status.message} />
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2">
          {loading && <FaSpinner className="animate-spin" size={12} />}
          {loading ? "Saving…" : "Save changes"}
        </button>
      </form>
    </SectionCard>
  );
}

// ─── Change Password Section ──────────────────────────────────────────────────

function PasswordSection() {
  const [current, setCurrent]   = useState("");
  const [newPass, setNewPass]   = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [status, setStatus]           = useState({ type: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    if (newPass !== confirm) {
      setStatus({ type: "error", message: "New passwords do not match." });
      return;
    }
    if (newPass.length < 8) {
      setStatus({ type: "error", message: "New password must be at least 8 characters." });
      return;
    }
    setLoading(true);
    try {
      await api.patch("/auth/change-password", { currentPassword: current, newPassword: newPass });
      setStatus({ type: "success", message: "Password changed successfully." });
      setCurrent(""); setNewPass(""); setConfirm("");
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Failed to change password." });
    } finally {
      setLoading(false);
    }
  };

  const strength = newPass.length === 0 ? 0 : newPass.length < 8 ? 1 : newPass.length < 12 ? 2 : /[A-Z]/.test(newPass) && /[0-9]/.test(newPass) ? 4 : 3;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-500"];

  return (
    <SectionCard icon={FaLock} title="Change Password" description="Choose a strong password for your account." iconColor="bg-amber-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Current password</label>
          <div className="relative">
            <input type={showCurrent ? "text" : "password"} value={current} onChange={(e) => setCurrent(e.target.value)}
              placeholder="Enter current password" className={`${inputCls} pr-11`} required />
            <button type="button" onClick={() => setShowCurrent(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
              {showCurrent ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">New password</label>
          <div className="relative">
            <input type={showNew ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)}
              placeholder="Min 8 characters" className={`${inputCls} pr-11`} required />
            <button type="button" onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
              {showNew ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
            </button>
          </div>
          {newPass && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : "bg-gray-100"}`} />
                ))}
              </div>
              <span className={`text-xs font-medium ${strength <= 1 ? "text-red-500" : strength === 2 ? "text-amber-500" : strength === 3 ? "text-blue-500" : "text-emerald-600"}`}>
                {strengthLabel[strength]}
              </span>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm new password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat new password" className={inputCls} required />
        </div>
        <Alert type={status.type} message={status.message} />
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2">
          {loading && <FaSpinner className="animate-spin" size={12} />}
          {loading ? "Changing…" : "Change password"}
        </button>
      </form>
    </SectionCard>
  );
}

// ─── 2FA Section ─────────────────────────────────────────────────────────────

function TwoFactorSection({ user, onUpdate }) {
  const [enabled, setEnabled] = useState(user?.twoFactorEnabled || false);
  const [step, setStep]       = useState("idle"); // idle | confirm-enable | confirm-disable
  const [pin, setPin]         = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState({ type: "", message: "" });
  const pinInputRefs = Array.from({ length: 6 }, () => null);
  const refs = { current: pinInputRefs };

  useEffect(() => { setEnabled(user?.twoFactorEnabled || false); }, [user]);

  const handlePinChange = (i, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...pin]; next[i] = digit; setPin(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };
  const handlePinKey = (i, e) => {
    if (e.key === "Backspace" && !pin[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const requestEnable = async () => {
    setLoading(true); setStatus({ type: "", message: "" });
    try {
      await api.post("/auth/2fa/enable");
      setStep("confirm-enable");
      setStatus({ type: "success", message: "Check your email for the verification code." });
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Failed to send code." });
    } finally { setLoading(false); }
  };

  const confirmEnable = async () => {
    const code = pin.join("");
    if (code.length !== 6) { setStatus({ type: "error", message: "Enter the 6-digit code." }); return; }
    setLoading(true); setStatus({ type: "", message: "" });
    try {
      await api.post("/auth/2fa/confirm", { pin: code });
      setEnabled(true); setStep("idle");
      setPin(["","","","","",""]);
      onUpdate({ ...user, twoFactorEnabled: true });
      setStatus({ type: "success", message: "Two-factor authentication is now enabled." });
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Incorrect code." });
    } finally { setLoading(false); }
  };

  const confirmDisable = async () => {
    if (!password) { setStatus({ type: "error", message: "Enter your password." }); return; }
    setLoading(true); setStatus({ type: "", message: "" });
    try {
      await api.post("/auth/2fa/disable", { password });
      setEnabled(false); setStep("idle"); setPassword("");
      onUpdate({ ...user, twoFactorEnabled: false });
      setStatus({ type: "success", message: "Two-factor authentication has been disabled." });
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Incorrect password." });
    } finally { setLoading(false); }
  };

  return (
    <SectionCard icon={FaShieldAlt} title="Two-Factor Authentication"
      description="Add an extra layer of security to your account." iconColor="bg-violet-500">
      <div className="space-y-4">

        {/* Status banner */}
        <div className={`flex items-center justify-between p-4 rounded-xl border ${enabled ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${enabled ? "bg-emerald-100" : "bg-gray-200"}`}>
              <FaShieldAlt size={14} className={enabled ? "text-emerald-600" : "text-gray-400"} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{enabled ? "2FA is enabled" : "2FA is disabled"}</p>
              <p className="text-xs text-gray-400">{enabled ? "Your account is protected with email OTP." : "Enable to require a code on every login."}</p>
            </div>
          </div>
          {step === "idle" && (
            enabled ? (
              <button onClick={() => { setStep("confirm-disable"); setStatus({ type: "", message: "" }); }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition">
                Disable
              </button>
            ) : (
              <button onClick={requestEnable} disabled={loading}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-violet-600 text-white hover:bg-violet-700 transition disabled:opacity-50 flex items-center gap-1.5">
                {loading && <FaSpinner className="animate-spin" size={10} />}
                Enable
              </button>
            )
          )}
        </div>

        {/* Confirm enable — enter PIN */}
        {step === "confirm-enable" && (
          <div className="space-y-4 p-4 rounded-xl bg-violet-50 border border-violet-100">
            <p className="text-sm font-medium text-violet-900">Enter the 6-digit code sent to your email:</p>
            <div className="flex gap-2">
              {pin.map((d, i) => (
                <input key={i} ref={(el) => (refs.current[i] = el)} type="text" inputMode="numeric"
                  maxLength={1} value={d}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKey(i, e)}
                  className={`w-10 h-12 text-center text-lg font-bold rounded-xl border-2 bg-white focus:outline-none transition
                    ${d ? "border-violet-400" : "border-gray-200"} focus:border-violet-400`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={confirmEnable} disabled={loading}
                className="px-4 py-2 rounded-full bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition disabled:opacity-50 flex items-center gap-1.5">
                {loading && <FaSpinner className="animate-spin" size={10} />} Confirm
              </button>
              <button onClick={() => { setStep("idle"); setPin(["","","","","",""]); }}
                className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:border-gray-300 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Confirm disable — enter password */}
        {step === "confirm-disable" && (
          <div className="space-y-4 p-4 rounded-xl bg-red-50 border border-red-100">
            <p className="text-sm font-medium text-red-900">Enter your password to disable 2FA:</p>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password" className={inputCls} />
            <div className="flex gap-2">
              <button onClick={confirmDisable} disabled={loading}
                className="px-4 py-2 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-1.5">
                {loading && <FaSpinner className="animate-spin" size={10} />} Disable 2FA
              </button>
              <button onClick={() => { setStep("idle"); setPassword(""); }}
                className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 text-xs font-semibold hover:border-gray-300 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        <Alert type={status.type} message={status.message} />
      </div>
    </SectionCard>
  );
}

// ─── Theme Section ────────────────────────────────────────────────────────────

function ThemeSection() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <SectionCard icon={isDark ? FaMoon : FaSun} title="Appearance" description="Choose how EazWorld looks for you." iconColor={isDark ? "bg-slate-700" : "bg-amber-400"}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{isDark ? "Dark mode" : "Light mode"}</p>
          <p className="text-xs text-gray-400 mt-0.5">{isDark ? "Easy on the eyes at night." : "Clean and bright interface."}</p>
        </div>
        <button onClick={toggleTheme}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none
            ${isDark ? "bg-amber-500" : "bg-gray-200"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform
            ${isDark ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </div>
    </SectionCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, setUser } = useAuth();

  const handleUpdate = (updatedUser) => {
    if (updatedUser) setUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 pt-24 pb-24 transition-colors">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="mb-4 inline-block text-sm text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 transition">
            ← Dashboard
          </Link>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your profile, password, and security.</p>
        </div>

        <div className="space-y-6">
          <ThemeSection />
          <ProfileSection user={user} onUpdate={handleUpdate} />
          <PasswordSection />
          <TwoFactorSection user={user} onUpdate={handleUpdate} />
        </div>

      </div>
    </div>
  );
}
