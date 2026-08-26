"use client";

import { controlBase, controlSizes, controlBorder } from "@/components/ui/controlStyles";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  User, Lock, ShieldCheck,
  Eye, EyeOff, Moon, Sun,
} from "lucide-react";
import { Alert, Button, SectionCard, Switch } from "@/components/ui";
import { useTheme } from "@/context/ThemeContext";
import { sanitizeName, sanitizePhone } from "@/lib/sanitize";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputCls = `${controlBase} ${controlSizes.md} ${controlBorder(false)}`;

/* Password-strength ramp, mapped onto the measured semantic tokens so each
 * step passes AA in both themes (the old blue/emerald stops did not). */
const STRENGTH_STEPS = [
  null,
  { label: "Weak",   bar: "bg-error",   text: "text-error dark:text-error-dark" },
  { label: "Fair",   bar: "bg-warning", text: "text-warning dark:text-warning-dark" },
  { label: "Good",   bar: "bg-info",    text: "text-info dark:text-info-dark" },
  { label: "Strong", bar: "bg-success", text: "text-success dark:text-success-dark" },
];

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
    <SectionCard icon={User} title="Profile Information" description="Update your name and phone number." iconColor="bg-info">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="settings-name" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Full name</label>
          <input id="settings-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
        </div>
        <div>
          <label htmlFor="settings-email" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email address</label>
          <input id="settings-email" type="email" value={user?.email || ""} disabled className={`${inputCls} bg-paper dark:bg-slate-800 text-gray-600 dark:text-slate-400 cursor-not-allowed`} />
          <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">Email cannot be changed.</p>
        </div>
        <div>
          <label htmlFor="settings-phone" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Phone number <span className="font-normal text-gray-500 dark:text-slate-400">(optional)</span></label>
          <input id="settings-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 00 000 0000" className={inputCls} />
        </div>
        {status.message && <Alert tone={status.type}>{status.message}</Alert>}
        <Button type="submit" loading={loading}>
          {loading ? "Saving…" : "Save changes"}
        </Button>
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
  const step = STRENGTH_STEPS[strength];

  return (
    <SectionCard icon={Lock} title="Change Password" description="Choose a strong password for your account." iconColor="bg-brand-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pw-current" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Current password</label>
          <div className="relative">
            <input id="pw-current" type={showCurrent ? "text" : "password"} value={current} onChange={(e) => setCurrent(e.target.value)}
              placeholder="Enter current password" className={`${inputCls} pr-11`} required />
            <button type="button" onClick={() => setShowCurrent(v => !v)} aria-label={showCurrent ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition">
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="pw-new" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">New password</label>
          <div className="relative">
            <input id="pw-new" type={showNew ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)}
              placeholder="Min 8 characters" className={`${inputCls} pr-11`} required />
            <button type="button" onClick={() => setShowNew(v => !v)} aria-label={showNew ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition">
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {newPass && step && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? step.bar : "bg-gray-100 dark:bg-slate-800"}`} />
                ))}
              </div>
              <span className={`text-xs font-medium ${step.text}`}>{step.label}</span>
            </div>
          )}
        </div>
        <div>
          <label htmlFor="pw-confirm" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Confirm new password</label>
          <input id="pw-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat new password" className={inputCls} required />
        </div>
        {status.message && <Alert tone={status.type}>{status.message}</Alert>}
        <Button type="submit" loading={loading}>
          {loading ? "Changing…" : "Change password"}
        </Button>
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
    <SectionCard icon={ShieldCheck} title="Two-Factor Authentication"
      description="Add an extra layer of security to your account." iconColor="bg-gray-800">
      <div className="space-y-4">

        {/* Status banner */}
        <div className={`flex items-center justify-between p-4 rounded-xl border ${
          enabled
            ? "bg-success-surface border-success/20 dark:bg-success-surface-dark dark:border-success-dark/30"
            : "bg-paper border-gray-100 dark:bg-slate-800/50 dark:border-slate-700"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              enabled ? "bg-success-surface dark:bg-success-surface-dark" : "bg-gray-200 dark:bg-slate-700"
            }`}>
              <ShieldCheck size={14} aria-hidden="true" className={enabled ? "text-success dark:text-success-dark" : "text-gray-600 dark:text-slate-400"} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{enabled ? "2FA is enabled" : "2FA is disabled"}</p>
              <p className="text-xs text-gray-600 dark:text-slate-400">{enabled ? "Your account is protected with email OTP." : "Enable to require a code on every login."}</p>
            </div>
          </div>
          {step === "idle" && (
            enabled ? (
              <Button variant="secondary" size="sm" onClick={() => { setStep("confirm-disable"); setStatus({ type: "", message: "" }); }}>
                Disable
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={requestEnable} loading={loading}>
                Enable
              </Button>
            )
          )}
        </div>

        {/* Confirm enable — enter PIN */}
        {step === "confirm-enable" && (
          <div className="space-y-4 p-4 rounded-xl bg-brand-50 border border-brand-200 dark:bg-brand-900/20 dark:border-brand-800/60">
            <p className="text-sm font-medium text-brand-ink dark:text-brand-400">Enter the 6-digit code sent to your email:</p>
            <div className="flex gap-2">
              {pin.map((d, i) => (
                <input key={i} ref={(el) => (refs.current[i] = el)} type="text" inputMode="numeric"
                  maxLength={1} value={d} aria-label={`Digit ${i + 1}`}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKey(i, e)}
                  className={`w-10 h-12 text-center text-lg font-bold rounded-xl border-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none transition
                    ${d ? "border-brand-400" : "border-gray-200 dark:border-slate-700"} focus:border-brand-400`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={confirmEnable} loading={loading}>Confirm</Button>
              <Button variant="secondary" size="sm" onClick={() => { setStep("idle"); setPin(["","","","","",""]); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Confirm disable — enter password */}
        {step === "confirm-disable" && (
          <div className="space-y-4 p-4 rounded-xl bg-error-surface border border-error/20 dark:bg-error-surface-dark dark:border-error-dark/30">
            <p className="text-sm font-medium text-error dark:text-error-dark">Enter your password to disable 2FA:</p>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password" aria-label="Your password" className={inputCls} />
            <div className="flex gap-2">
              <Button variant="danger" size="sm" onClick={confirmDisable} loading={loading}>Disable 2FA</Button>
              <Button variant="secondary" size="sm" onClick={() => { setStep("idle"); setPassword(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {status.message && <Alert tone={status.type}>{status.message}</Alert>}
      </div>
    </SectionCard>
  );
}

// ─── Theme Section ────────────────────────────────────────────────────────────

function ThemeSection() {
  const { isDark, toggleTheme, mounted } = useTheme();
  const dark = mounted && isDark;
  return (
    <SectionCard icon={dark ? Moon : Sun} title="Appearance" description="Choose how EazWorld looks for you." iconColor={dark ? "bg-slate-700" : "bg-brand-500"}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{dark ? "Dark mode" : "Light mode"}</p>
          <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">{dark ? "Easy on the eyes at night." : "Clean and bright interface."}</p>
        </div>
        <Switch checked={dark} onChange={toggleTheme} aria-label="Dark mode" />
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
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24 transition-colors">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition">
            ← Dashboard
          </Link>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <p className="text-gray-600 dark:text-slate-400 text-sm mt-1">Manage your profile, password, and security.</p>
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
