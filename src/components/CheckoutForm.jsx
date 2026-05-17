"use client";

import { useState } from "react";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { sanitizeName, sanitizeEmail, sanitizePhone, sanitizeText } from "@/lib/sanitize";

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 transition bg-white dark:bg-slate-800";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  years: z.number().min(1).max(10),
});

export default function CheckoutForm({ domain, price }) {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(" ").slice(1).join(" ") || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [years, setYears] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = price * years;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const cleanFirst   = sanitizeName(firstName);
    const cleanLast    = sanitizeName(lastName);
    const cleanEmail   = sanitizeEmail(email);
    const cleanPhone   = sanitizePhone(phone);
    const cleanAddress = sanitizeText(address, 200);
    const cleanCity    = sanitizeText(city, 100);
    const result = schema.safeParse({ firstName: cleanFirst, lastName: cleanLast, email: cleanEmail, phone: cleanPhone, address: cleanAddress, city: cleanCity, years });
    if (!result.success) { setError("Please fill in all required fields."); return; }
    setLoading(true);
    try {
      const res = await api.post("/domain/payment", {
        domain,
        email:     cleanEmail,
        amount:    total,
        currency:  "GHS",
        firstName: cleanFirst,
        lastName:  cleanLast,
        phone:     cleanPhone,
        years,
        registrantInfo: { firstName: cleanFirst, lastName: cleanLast, address: cleanAddress, city: cleanCity, country: "GH", postalCode: "00233" },
      });
      const { authorizationUrl } = res.data;
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">First name</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={inputCls} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Last name</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={inputCls} required />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} required />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Phone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 00 000 0000" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">City</label>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Accra" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">Registration period</label>
        <select value={years} onChange={(e) => setYears(Number(e.target.value))} className={inputCls}>
          {[1, 2, 3, 4, 5].map((y) => (
            <option key={y} value={y}>{y} year{y > 1 ? "s" : ""} — GH₵{(price * y).toFixed(0)}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-gray-500 dark:text-slate-400">Total</span>
        <span className="text-lg font-bold text-amber-500">GH₵{total.toFixed(0)}</span>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="w-full py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition disabled:opacity-50 text-sm">
        {loading ? "Redirecting to payment..." : "Pay with Paystack"}
      </button>

      <p className="text-center text-xs text-gray-400 dark:text-slate-500">Secured by Paystack · MTN MoMo · Vodafone Cash · Card</p>
    </form>
  );
}
