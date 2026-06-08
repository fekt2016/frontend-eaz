"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FaShieldAlt, FaWrench, FaCheckCircle, FaClock, FaTimesCircle, FaMobileAlt } from "react-icons/fa";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.eazworld.co/api/v1";

const STATUS_CONFIG = {
  received:          { label: "Received",           color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/30",   step: 1 },
  diagnosing:        { label: "Diagnosing",          color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30", step: 2 },
  waiting_for_parts: { label: "Waiting for Parts",   color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", step: 2 },
  repairing:         { label: "Repairing",           color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30",  step: 3 },
  ready:             { label: "Ready for Collection",color: "text-green-400",  bg: "bg-green-500/10 border-green-500/30",  step: 4 },
  collected:         { label: "Collected",           color: "text-gray-400",   bg: "bg-gray-500/10 border-gray-700",       step: 5 },
  cancelled:         { label: "Cancelled",           color: "text-red-400",    bg: "bg-red-500/10 border-red-500/30",      step: 0 },
};

const STEPS = [
  { label: "Received",  step: 1 },
  { label: "Diagnosing / Repairing", step: 3 },
  { label: "Ready",     step: 4 },
  { label: "Collected", step: 5 },
];

export default function TrackPage() {
  const { token } = useParams();
  const [job,     setJob]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/track/${token}`)
      .then(r => r.json())
      .then(r => {
        if (!r.success) throw new Error(r.error || "Job not found.");
        setJob(r.data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-700 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <FaTimesCircle size={40} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Job Not Found</h1>
        <p className="text-gray-400 text-sm">
          This tracking link may be invalid or expired. Please contact us for assistance.
        </p>
        <a
          href={`tel:${process.env.NEXT_PUBLIC_SHOP_PHONE || "0244388190"}`}
          className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition"
        >
          <FaMobileAlt size={13} /> Call Us
        </a>
      </div>
    </div>
  );

  const cfg     = STATUS_CONFIG[job.status] || STATUS_CONFIG.received;
  const isCancelled = job.status === "cancelled";
  const isDone      = job.status === "collected";
  const currentStep = cfg.step;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
            <FaWrench size={14} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">EazWorld Repair</p>
            <p className="text-xs text-gray-500">Repair Tracker</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Job number + status */}
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Job Number</p>
          <h1 className="text-3xl font-bold font-mono text-amber-400">{job.jobNumber}</h1>
          {job.customerName && (
            <p className="text-gray-400 text-sm mt-1">For {job.customerName}</p>
          )}
        </div>

        {/* Status badge */}
        <div className={`flex items-center justify-center gap-3 px-5 py-4 rounded-2xl border ${cfg.bg}`}>
          {isDone       ? <FaCheckCircle size={20} className={cfg.color} /> :
           isCancelled  ? <FaTimesCircle size={20} className={cfg.color} /> :
                          <FaClock size={20} className={cfg.color} />}
          <div>
            <p className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</p>
            {!isCancelled && !isDone && (
              <p className="text-xs text-gray-400 mt-0.5">Your device is being taken care of</p>
            )}
          </div>
        </div>

        {/* Progress steps — hide for cancelled */}
        {!isCancelled && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Progress</p>
            <div className="space-y-3">
              {STEPS.map((s, i) => {
                const done    = currentStep > s.step;
                const active  = currentStep === s.step || (s.step === 3 && [2,3].includes(currentStep));
                return (
                  <div key={s.step} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition ${
                      done   ? "bg-green-500 text-white" :
                      active ? "bg-amber-500 text-white" :
                               "bg-gray-800 border border-gray-700 text-gray-500"
                    }`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <p className={`text-sm font-medium ${
                      done ? "text-green-400" : active ? "text-amber-400" : "text-gray-500"
                    }`}>
                      {s.label}
                    </p>
                    {active && !done && (
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Device details */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Device</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Device</p>
              <p className="text-white font-medium">{job.device || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Issue reported</p>
              <p className="text-gray-300">{job.faultDescription}</p>
            </div>
            {job.repairWork && (
              <div className="col-span-2">
                <p className="text-gray-500 text-xs">Repair work</p>
                <p className="text-gray-300">{job.repairWork}</p>
              </div>
            )}
            {job.estimatedCompletion && job.status !== "collected" && job.status !== "ready" && (
              <div className="col-span-2">
                <p className="text-gray-500 text-xs">Estimated completion</p>
                <p className="text-amber-400 font-medium">
                  {new Date(job.estimatedCompletion).toLocaleString("en-GH", { dateStyle: "long", timeStyle: "short" })}
                </p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-xs">Job created</p>
              <p className="text-gray-300">{new Date(job.createdAt).toLocaleDateString("en-GH", { dateStyle: "long" })}</p>
            </div>
            {job.completedAt && (
              <div>
                <p className="text-gray-500 text-xs">Completed</p>
                <p className="text-green-400">{new Date(job.completedAt).toLocaleDateString("en-GH", { dateStyle: "long" })}</p>
              </div>
            )}
          </div>
        </div>

        {/* Ready for collection alert */}
        {job.status === "ready" && (
          <div className="flex items-start gap-3 px-4 py-4 rounded-2xl bg-green-500/10 border border-green-500/30">
            <FaCheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 font-semibold text-sm">Your device is ready!</p>
              <p className="text-gray-300 text-xs mt-1">
                Please come to our shop to collect your device. Bring this job number: <span className="font-mono font-bold text-amber-400">{job.jobNumber}</span>
              </p>
            </div>
          </div>
        )}

        {/* Warranty */}
        {job.warrantyDays > 0 && job.warrantyExpires && (
          <div className={`flex items-start gap-3 px-4 py-4 rounded-2xl border ${
            job.warrantyStatus === "active"        ? "bg-green-500/10 border-green-500/30" :
            job.warrantyStatus === "expiring_soon" ? "bg-amber-500/10 border-amber-500/30" :
            "bg-gray-500/10 border-gray-700"
          }`}>
            <FaShieldAlt size={18} className={
              job.warrantyStatus === "active"        ? "text-green-400" :
              job.warrantyStatus === "expiring_soon" ? "text-amber-400" : "text-gray-500"
            } />
            <div>
              <p className={`font-semibold text-sm ${
                job.warrantyStatus === "active"        ? "text-green-400" :
                job.warrantyStatus === "expiring_soon" ? "text-amber-400" : "text-gray-500"
              }`}>
                {job.warrantyDays}-day Warranty
                {job.warrantyStatus === "expired" ? " (Expired)" : ""}
              </p>
              {job.warrantyNotes && (
                <p className="text-gray-400 text-xs mt-0.5">{job.warrantyNotes}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {job.warrantyStatus === "expired"
                  ? `Expired on ${new Date(job.warrantyExpires).toLocaleDateString("en-GH", { dateStyle: "long" })}`
                  : `Valid until ${new Date(job.warrantyExpires).toLocaleDateString("en-GH", { dateStyle: "long" })}`}
              </p>
            </div>
          </div>
        )}

        {/* Device photos */}
        {job.photos?.length > 0 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Device Photos at Intake</p>
            <div className="grid grid-cols-3 gap-2">
              {job.photos.map((photo, i) => (
                <a key={i} href={photo.url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden bg-gray-800 block">
                  <img src={photo.url} alt={photo.caption || `Photo ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition duration-200" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="text-center pt-2 pb-6">
          <p className="text-gray-500 text-xs mb-3">Need help? Contact us</p>
          <a
            href="tel:0244388190"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-amber-500/50 text-gray-300 hover:text-white text-sm font-medium transition"
          >
            <FaMobileAlt size={13} className="text-amber-400" />
            0244 388 190
          </a>
          <p className="text-gray-700 text-xs mt-6">Powered by EazWorld · eazworld.co</p>
        </div>

      </main>
    </div>
  );
}
