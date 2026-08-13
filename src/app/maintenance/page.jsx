"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaTools, FaWhatsapp, FaEnvelope, FaClock } from "react-icons/fa";

function pad(n) {
  return String(n).padStart(2, "0");
}

function Countdown({ until }) {
  const target = until ? new Date(until).getTime() : null;
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setRemaining(null); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setRemaining({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!remaining) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <FaClock size={14} className="text-brand-400 flex-shrink-0" />
      <p className="text-sm text-gray-400 dark:text-slate-400">Back in</p>
      {[
        { label: "hrs",  val: remaining.h },
        { label: "min",  val: remaining.m },
        { label: "sec",  val: remaining.s },
      ].map(({ label, val }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums text-white bg-slate-800 dark:bg-slate-700 rounded-xl w-14 h-14 flex items-center justify-center">
            {pad(val)}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-slate-500 mt-1 uppercase tracking-widest">{label}</span>
        </div>
      ))}
    </div>
  );
}

function MaintenanceContent() {
  const params   = useSearchParams();
  const message  = params.get("msg")   || "We're performing scheduled maintenance.\nWe'll be back shortly!";
  const until    = params.get("until") || null;

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 text-center">

      {/* Animated cog */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-brand-500/10 border-2 border-brand-500/30 flex items-center justify-center">
          <FaTools size={36} className="text-brand-400 animate-pulse" />
        </div>
        {/* outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-brand-500/20 animate-spin" style={{ animationDuration: "8s" }} />
      </div>

      {/* Brand */}
      <p className="text-brand-400 text-xs font-bold tracking-[0.25em] uppercase mb-3">EazWorld</p>

      {/* Heading */}
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
        Under Maintenance
      </h1>

      {/* Message */}
      <p className="text-gray-400 text-base max-w-md leading-relaxed whitespace-pre-line">
        {message}
      </p>

      {/* Countdown timer */}
      <Countdown until={until} />

      {/* Divider */}
      <div className="w-16 h-px bg-slate-700 my-8" />

      {/* Contact links */}
      <p className="text-xs text-gray-500 mb-4 uppercase tracking-widest">Need urgent help?</p>
      <div className="flex flex-wrap justify-center gap-3">
        <a
          href="https://wa.me/233244388190"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition"
        >
          <FaWhatsapp size={15} /> WhatsApp Us
        </a>
        <a
          href="mailto:support@eazworld.com"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-700 hover:border-slate-500 text-gray-300 hover:text-white text-sm font-semibold transition"
        >
          <FaEnvelope size={13} /> Email Support
        </a>
      </div>

      {/* Admin back-door link — subtle, only visible on hover */}
      <Link
        href="/auth/login"
        className="mt-12 text-[11px] text-slate-700 hover:text-slate-400 transition"
      >
        Admin login →
      </Link>
    </main>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense>
      <MaintenanceContent />
    </Suspense>
  );
}
