"use client";

import { useState, useMemo } from "react";
import { Check, X, Lock, Loader2, Eye, EyeOff, User } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { sanitizeName, sanitizeEmail, sanitizePhone, sanitizeText, getPasswordRules, validatePassword } from "@/lib/sanitize";

const WEBSITE_TYPES = [
  "Business / Corporate",
  "E-Commerce / Online Store",
  "Portfolio / Personal",
  "Blog / News",
  "Landing Page",
  "Non-Profit / NGO",
  "Other",
];

export default function ServicePaymentModal({ pkg, onClose }) {
  const { user } = useAuth();
  const isGuest = !user;

  // Personal info (guests only)
  const [name,         setName]         = useState(user?.name  || "");
  const [email,        setEmail]        = useState(user?.email || "");
  const [phone,        setPhone]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Website details (everyone)
  const [businessName,  setBusinessName]  = useState("");
  const [websiteType,   setWebsiteType]   = useState("");
  const [colorPrefs,    setColorPrefs]    = useState("");
  const [features,      setFeatures]      = useState("");
  const [refWebsites,   setRefWebsites]   = useState("");
  const [notes,         setNotes]         = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const passwordRules  = useMemo(() => getPasswordRules(password), [password]);

  const inputCls    = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-400 transition";
  const selectCls   = `${inputCls} cursor-pointer`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanName  = isGuest ? sanitizeName(name)    : user.name;
    const cleanEmail = isGuest ? sanitizeEmail(email)  : user.email;
    const cleanPhone = isGuest ? sanitizePhone(phone)  : undefined;
    const cleanBiz   = sanitizeName(businessName);
    const cleanNotes = sanitizeText(
      [
        websiteType   ? `Website type: ${websiteType}`         : "",
        colorPrefs    ? `Color preferences: ${colorPrefs}`     : "",
        features      ? `Features needed: ${features}`         : "",
        refWebsites   ? `Reference websites: ${refWebsites}`   : "",
        notes         ? `Additional notes: ${notes}`           : "",
      ].filter(Boolean).join("\n"),
      2000
    );

    if (isGuest && (!cleanName || !cleanEmail)) {
      setError("Name and email are required.");
      return;
    }

    if (isGuest && password) {
      const pwError = validatePassword(password);
      if (pwError) { setError(pwError); return; }
    }

    if (!websiteType) {
      setError("Please select the type of website you need.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/services/payment", {
        name:         cleanName,
        email:        cleanEmail,
        phone:        cleanPhone,
        businessName: cleanBiz,
        package:      pkg.name,
        notes:        cleanNotes,
        ...(isGuest && password ? { password } : {}),
      });

      if (res.data?.authorizationUrl) {
        window.location.href = res.data.authorizationUrl;
      } else {
        setError("Could not initialize payment. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">{pkg.name}</h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Pay 50% deposit to get started</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <X size={14} />
          </button>
        </div>

        {/* Deposit summary */}
        <div className="mx-5 mt-4 p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30 flex items-center justify-between">
          <div>
            <p className="text-xs text-brand-700 dark:text-brand-400 font-medium">Deposit (50% upfront)</p>
            <p className="text-xl font-bold text-brand-600 dark:text-brand-400">GH₵{pkg.deposit.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-slate-500">Project total starts from</p>
            <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">GH₵{pkg.total.toLocaleString()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Logged-in greeting */}
          {!isGuest && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm flex-shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user.email}</p>
              </div>
              <User size={11} className="text-gray-300 dark:text-slate-600 flex-shrink-0 ml-auto" />
            </div>
          )}

          {/* ── Personal info (guests only) ── */}
          {isGuest && (
            <>
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Your details</p>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Full name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className={inputCls} required />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email address *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} required />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Phone number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 00 000 0000" className={inputCls} />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Create a password <span className="text-gray-400 font-normal">(optional — to track your order)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className={`${inputCls} pr-10`}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5 bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3">
                    {passwordRules.map(({ rule, met }) => (
                      <div key={rule} className="flex items-center gap-2">
                        {met ? <Check size={9} className="text-emerald-500 flex-shrink-0" /> : <X size={9} className="text-red-400 flex-shrink-0" />}
                        <span className={`text-xs ${met ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}`}>{rule}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
                  We&apos;ll create a free account so you can track your order in the dashboard.
                </p>
              </div>
            </>
          )}

          {/* ── Website details (everyone) ── */}
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide pt-1">Website details</p>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Business / website name</label>
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="My Business Ltd" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Type of website *</label>
            <select value={websiteType} onChange={(e) => setWebsiteType(e.target.value)} className={selectCls} required>
              <option value="">Select a type…</option>
              {WEBSITE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Color preferences <span className="text-gray-400">(optional)</span></label>
            <input value={colorPrefs} onChange={(e) => setColorPrefs(e.target.value)} placeholder="e.g. Blue and white, dark theme…" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Features needed <span className="text-gray-400">(optional)</span></label>
            <input value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="e.g. Online store, booking, gallery, blog…" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Reference websites <span className="text-gray-400">(optional)</span></label>
            <input value={refWebsites} onChange={(e) => setRefWebsites(e.target.value)} placeholder="e.g. apple.com, airbnb.com…" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Additional notes <span className="text-gray-400">(optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else we should know about your project?"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={13} /> Redirecting to payment…</>
            ) : (
              <><Lock size={11} /> Pay GH₵{pkg.deposit.toLocaleString()} Deposit</>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 dark:text-slate-500">
            Secured by Paystack · MTN MoMo · Vodafone Cash · Card
          </p>
        </form>
      </div>
    </div>
  );
}
