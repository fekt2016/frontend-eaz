"use client";

import { errorMessage } from "@/lib/api";
import { controlBase, controlSizes, controlBorder } from "@/components/ui/controlStyles";
import { useState, useEffect } from "react";
import Link from "next/link";
import { z } from "zod";
import { CheckCircle2, Smartphone, Store, Bike, Copy, ArrowRight, ShieldCheck, Clock, Lock } from "lucide-react";
import { sanitizeName, sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/sanitize";
import { useAuth } from "@/context/AuthContext";
import { useCreatePublicJob } from "@/hooks/queries/usePosJobs";

const DEVICE_TYPES = ["Phone", "Tablet", "Laptop", "Smartwatch", "Other"];
const BRANDS = ["Apple", "Samsung", "Tecno", "Infinix", "Itel", "Huawei", "Nokia", "Oppo", "Xiaomi", "OnePlus", "Other"];

const schema = z.object({
  name: z.string().min(1, "Please enter your name"),
  phone: z.string().min(9, "Enter a valid phone number"),
  email: z.string().optional(),
  deviceType: z.string().min(1, "Select a device type"),
  deviceBrand: z.string().min(1, "Select a brand"),
  deviceModel: z.string().min(1, "Enter the model"),
  faultDescription: z.string().min(10, "Please describe the problem in a few words"),
  dropoff: z.enum(["bring", "rider"]),
  pickupAddress: z.string().optional(),
});

const inputCls = `${controlBase} ${controlSizes.md} ${controlBorder(false)}`;
const selectCls = `${inputCls} cursor-pointer`;

const SHOP_ADDRESS = "E1/12 Nima, Alwaleed bin Talal Highway, Nima, Accra";

export default function BookRepairPage() {
  const { user } = useAuth();
  const [fields, setFields] = useState({
    name: "", phone: "", email: "",
    deviceType: "Phone", deviceBrand: "", deviceModel: "", imei: "", color: "",
    faultDescription: "", dropoff: "bring", pickupAddress: "",
  });
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);

  const createJob = useCreatePublicJob();
  const status = createJob.isPending ? "loading" : createJob.isSuccess ? "success" : "idle";
  const result = createJob.data ?? null;

  // Logged-in customer — pre-fill their details so it's a "create my own job"
  useEffect(() => {
    if (!user) return;
    setFields((f) => ({
      ...f,
      name:        f.name  || user.name || "",
      phone:       f.phone || user.phone || "",
      email:       f.email || user.email || "",
    }));
  }, [user]);

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = {
      name:             sanitizeName(fields.name),
      phone:            sanitizePhone(fields.phone),
      email:            sanitizeEmail(fields.email),
      deviceType:       fields.deviceType,
      deviceBrand:      sanitizeText(fields.deviceBrand, 60),
      deviceModel:      sanitizeText(fields.deviceModel, 100),
      imei:             sanitizeText(fields.imei, 20),
      color:            sanitizeText(fields.color, 40),
      faultDescription: sanitizeText(fields.faultDescription, 1000),
      dropoff:          fields.dropoff,
      pickupAddress:    sanitizeText(fields.pickupAddress, 300),
    };

    const resultZod = schema.safeParse(clean);
    if (!resultZod.success) {
      const errs = {};
      resultZod.error.issues.forEach((i) => { errs[i.path[0]] = i.message; });
      setErrors(errs);
      return;
    }

    setErrors({});
    createJob.mutate(clean, {
      onError: (err) => setErrors({ form: errorMessage(err, "Something went wrong. Please try again.") }),
    });
  };

  const copyLink = async () => {
    if (!result?.trackingUrl) return;
    try { await navigator.clipboard.writeText(result.trackingUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  /* ── SUCCESS STATE ─────────────────────────────────────────── */
  if (status === "success" && result) {
    return (
      <div className="min-h-screen bg-paper dark:bg-ink flex items-center justify-center px-4 pt-16 pb-24">
        <div className="max-w-md w-full text-center p-10 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="text-emerald-500 text-3xl" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">Repair Request Booked!</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-5">Job number <span className="font-semibold text-gray-900 dark:text-white">{result.jobNumber}</span></p>

          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-ink p-4 mb-5 text-left">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">Track your repair</p>
            <p className="text-xs text-gray-600 dark:text-slate-300 break-all mb-3">{typeof window !== "undefined" ? window.location.origin : ""}/track/{result.trackingToken}</p>
            <div className="flex gap-2">
              <Link
                href={`/track/${result.trackingToken}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 text-xs font-semibold hover:bg-gray-700 dark:hover:bg-brand-400 transition"
              >
                Track now <ArrowRight size={10} />
              </Link>
              <button
                type="button"
                onClick={copyLink}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition"
              >
                {copied ? <><CheckCircle2 className="text-emerald-500" size={11}/> Copied</> : <><Copy size={11} /> Copy link</>}
              </button>
            </div>
          </div>

          <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800/30 rounded-xl p-4 mb-2 text-left">
            <p className="text-xs font-semibold text-brand-ink dark:text-brand-400 mb-2">What happens next?</p>
            <ul className="space-y-1.5">
              {result.dropoff === "rider" ? (
                <>
                  <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                    <Bike className="text-brand-400 flex-shrink-0" size={11} /> Our rider will call {result.customer?.phone} to arrange pickup from {result.pickupAddress || "your location"}
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                    <Smartphone className="text-brand-400 flex-shrink-0" size={11} /> Pack your device securely and keep your login codes handy
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                    <Store className="text-brand-400 flex-shrink-0" size={11} /> Bring the device to our shop
                  </li>
                  <li className="pl-5 text-[11px] text-gray-500 dark:text-slate-500">{SHOP_ADDRESS}</li>
                  <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                    <Clock className="text-brand-400 flex-shrink-0" size={11} /> Open Mon–Fri 9AM–6PM · Sat 10AM–4PM
                  </li>
                </>
              )}
              <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-slate-400">
                <ShieldCheck className="text-brand-400 flex-shrink-0" size={11} /> Free assessment — we only start work after you approve the quote
              </li>
            </ul>
          </div>

          <Link href="/" className="inline-block mt-5 px-6 py-3 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-paper dark:hover:bg-slate-800 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  /* ── MAIN PAGE ─────────────────────────────────────────────── */
  return (
    <div className="bg-paper dark:bg-ink text-gray-900 dark:text-white">
      {/* HERO */}
      <section className="pt-28 pb-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30 px-3 py-1 rounded-full mb-5">
            Phone Repair · Accra · 30-Day Warranty
          </span>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-gray-900 dark:text-white mb-4 leading-tight">
            Book a Repair in 2 Minutes
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-2 max-w-lg mx-auto">
            Bring your device to the shop, or send a rider to collect it — the choice is yours.
          </p>
          <p className="text-gray-600 dark:text-slate-500 text-sm max-w-md mx-auto">
            Free honest assessment. You approve the quote before any work starts.
          </p>
        </div>
      </section>

      {/* FORM */}
      <section className="pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="p-8 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Your details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Your name <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="Kwame Mensah" value={fields.name} onChange={set("name")} className={inputCls} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Phone <span className="text-red-400">*</span></label>
                  <input type="tel" placeholder="024 000 0000" value={fields.phone} onChange={set("phone")} className={inputCls} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Email <span className="text-gray-300 dark:text-slate-600">(optional — for updates)</span></label>
                <input type="email" placeholder="you@example.com" value={fields.email} onChange={set("email")} className={inputCls} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Device */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Device type <span className="text-red-400">*</span></label>
                  <select value={fields.deviceType} onChange={set("deviceType")} className={selectCls}>
                    {DEVICE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Brand <span className="text-red-400">*</span></label>
                  <select value={fields.deviceBrand} onChange={set("deviceBrand")} className={selectCls}>
                    <option value="">Select brand…</option>
                    {BRANDS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                  {errors.deviceBrand && <p className="text-red-500 text-xs mt-1">{errors.deviceBrand}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Model <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="e.g. iPhone 13, Galaxy A54" value={fields.deviceModel} onChange={set("deviceModel")} className={inputCls} />
                  {errors.deviceModel && <p className="text-red-500 text-xs mt-1">{errors.deviceModel}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Color <span className="text-gray-300 dark:text-slate-600">(optional)</span></label>
                  <input type="text" placeholder="e.g. Black, Gold" value={fields.color} onChange={set("color")} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">IMEI / Serial number <span className="text-gray-300 dark:text-slate-600">(optional)</span></label>
                <input type="text" placeholder="15-digit IMEI" value={fields.imei} onChange={set("imei")} className={inputCls} />
              </div>

              {/* Fault */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">
                  What&apos;s wrong with the device? <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Screen cracked, phone not charging, battery drains fast…"
                  value={fields.faultDescription}
                  onChange={set("faultDescription")}
                  className={`${inputCls} resize-none`}
                />
                {errors.faultDescription && <p className="text-red-500 text-xs mt-1">{errors.faultDescription}</p>}
              </div>

              {/* Delivery method */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">
                  How will we get your device? <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFields((f) => ({ ...f, dropoff: "bring" }))}
                    className={`text-left p-4 rounded-xl border-2 transition ${
                      fields.dropoff === "bring"
                        ? "border-brand-400 bg-brand-50 dark:bg-brand-900/20"
                        : "border-gray-100 dark:border-slate-700 bg-paper dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-500"
                    }`}
                  >
                    <Store className={`mb-2 ${fields.dropoff === "bring" ? "text-brand-500" : "text-gray-600"}`} />
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Bring it to the shop</p>
                    <p className="text-gray-600 dark:text-slate-500 text-xs mt-1 leading-relaxed">Walk in — free assessment in minutes.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFields((f) => ({ ...f, dropoff: "rider" }))}
                    className={`text-left p-4 rounded-xl border-2 transition ${
                      fields.dropoff === "rider"
                        ? "border-brand-400 bg-brand-50 dark:bg-brand-900/20"
                        : "border-gray-100 dark:border-slate-700 bg-paper dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-500"
                    }`}
                  >
                    <Bike className={`mb-2 ${fields.dropoff === "rider" ? "text-brand-500" : "text-gray-600"}`} />
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Send a rider to pick it up</p>
                    <p className="text-gray-600 dark:text-slate-500 text-xs mt-1 leading-relaxed">We&apos;ll call you to arrange collection.</p>
                  </button>
                </div>

                {fields.dropoff === "rider" && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Pickup address <span className="text-red-400">*</span></label>
                    <textarea
                      rows={2}
                      placeholder="Where should the rider collect the device? e.g. House, street, landmark"
                      value={fields.pickupAddress}
                      onChange={set("pickupAddress")}
                      className={`${inputCls} resize-none`}
                    />
                    {errors.pickupAddress && <p className="text-red-500 text-xs mt-1">{errors.pickupAddress}</p>}
                  </div>
                )}
              </div>

              {errors.form && <p className="text-red-500 text-xs">{errors.form}</p>}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-4 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 font-bold text-sm hover:bg-gray-700 dark:hover:bg-brand-400 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Booking…</>
                ) : (
                  <>Book My Repair <ArrowRight size={12} /></>
                )}
              </button>

              <p className="text-gray-600 dark:text-slate-500 text-xs text-center">
                <Lock size={11} className="inline-block align-text-bottom text-gray-600 dark:text-slate-500" /> Your details are only used for this repair. You&apos;ll get a tracking link by SMS/email.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
