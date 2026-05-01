"use client";

import { useState } from "react";
import { z } from "zod";

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition bg-white";

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
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
    const result = schema.safeParse({ firstName, lastName, email, phone, address, city, years });
    if (!result.success) {
      setError("Please fill required fields.");
      return;
    }
    setLoading(true);
    // TODO: POST /domain/payment
    setTimeout(() => {
      setLoading(false);
      setError("Payment gateway not connected yet.");
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={inputCls} required />
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={inputCls} required />
      </div>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputCls} required />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={inputCls} />
      <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className={inputCls} />
      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inputCls} />
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Years (1–10)</label>
        <select value={years} onChange={(e) => setYears(Number(e.target.value))} className={inputCls}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((y) => (
            <option key={y} value={y}>{y} year{y > 1 ? "s" : ""} — ${(price * y).toFixed(2)}</option>
          ))}
        </select>
      </div>
      <p className="text-amber-500 font-semibold">Total: ${total.toFixed(2)}</p>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="w-full py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition disabled:opacity-50">
        {loading ? "Processing..." : "Pay with Paystack"}
      </button>
    </form>
  );
}
