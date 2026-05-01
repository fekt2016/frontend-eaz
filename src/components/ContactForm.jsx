"use client";

import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition bg-white";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = schema.safeParse({ name, email, subject, message });
    if (!result.success) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    // TODO: POST /contacts
    setTimeout(() => {
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputCls} required />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputCls} required />
      <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (optional)" className={inputCls} />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" rows={4} className={inputCls} required />
      <button type="submit" disabled={status === "loading"} className="w-full py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 disabled:opacity-50 transition text-sm">
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>
      {status === "success" && <p className="text-emerald-600 text-sm text-center">Message sent successfully.</p>}
      {status === "error" && <p className="text-red-500 text-sm text-center">Please fill in all required fields.</p>}
    </form>
  );
}
