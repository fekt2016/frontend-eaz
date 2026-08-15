"use client";

import { useState } from "react";
import Link from "next/link";
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useWarrantyJobs } from "@/hooks/queries/usePosJobs";

const WARRANTY_COLORS = {
  active:        "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  expiring_soon: "bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/30",
  expired:       "bg-gray-500/15 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700",
};

const WARRANTY_LABELS = {
  active:        "Active",
  expiring_soon: "Expiring Soon",
  expired:       "Expired",
};

function daysLeft(dateStr) {
  const diff = new Date(dateStr) - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function JobWarrantyRow({ job, warrantyStatus }) {
  const expires  = job.warrantyExpires ? new Date(job.warrantyExpires) : null;
  const days     = expires ? daysLeft(expires) : null;

  return (
    <Link
      href={`/dashboard/pos/jobs/${job._id}`}
      className="flex items-center justify-between px-5 py-4 hover:bg-gray-100/40 dark:hover:bg-gray-800/40 transition border-b border-gray-200 dark:border-gray-800 last:border-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
          <FaShieldAlt size={11} className={
            warrantyStatus === "active"        ? "text-green-600 dark:text-green-400" :
            warrantyStatus === "expiring_soon" ? "text-brand-600 dark:text-brand-400" : "text-gray-500"
          } />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-mono font-semibold text-brand-600 dark:text-brand-400">{job.jobNumber}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${WARRANTY_COLORS[warrantyStatus]}`}>
              {WARRANTY_LABELS[warrantyStatus]}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {job.customer?.name} · {[job.deviceBrand, job.deviceModel].filter(Boolean).join(" ") || "—"}
          </p>
          {job.warrantyNotes && (
            <p className="text-xs text-gray-600 truncate">{job.warrantyNotes}</p>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 ml-3 text-right">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {expires ? expires.toLocaleDateString("en-GH", { dateStyle: "medium" }) : "—"}
        </p>
        {days !== null && (
          <p className={`text-xs font-semibold mt-0.5 ${
            days < 0 ? "text-gray-500" : days <= 7 ? "text-brand-600 dark:text-brand-400" : "text-green-600 dark:text-green-400"
          }`}>
            {days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? "Today" : `${days}d left`}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function WarrantyPage() {
  const [tab,     setTab]     = useState("active");

  const { data, isLoading: loading, error: queryError } = useWarrantyJobs();
  const error = queryError?.message || "";

  const activeJobs      = data?.active     || [];
  const expiringSoon    = data?.expiringSoon || [];
  const expiredJobs     = data?.expired     || [];

  const displayJobs = tab === "active"
    ? activeJobs.filter(j => j.warrantyStatus === "active" && !expiringSoon.find(e => e._id === j._id))
    : tab === "expiring"
    ? expiringSoon
    : expiredJobs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaShieldAlt className="text-green-600 dark:text-green-400" size={18} /> Warranty Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track active warranties and upcoming expirations</p>
        </div>
      </div>

      {/* Alert banner — expiring soon */}
      {!loading && expiringSoon.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-brand-500/10 border border-brand-500/30">
          <FaExclamationTriangle size={14} className="text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
              {expiringSoon.length} warranty{expiringSoon.length !== 1 ? "s" : ""} expiring within 7 days
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {expiringSoon.map(j => (
                <Link
                  key={j._id}
                  href={`/dashboard/pos/jobs/${j._id}`}
                  className="text-xs px-2.5 py-1 rounded-lg bg-brand-500/15 text-brand-300 hover:bg-brand-500/30 transition font-mono"
                >
                  {j.jobNumber} · {daysLeft(j.warrantyExpires)}d
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Active</p>
              <FaCheckCircle size={13} className="text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeJobs.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Valid warranties</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Expiring</p>
              <FaExclamationTriangle size={13} className="text-brand-600 dark:text-brand-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{expiringSoon.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Within 7 days</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Expired</p>
              <FaTimesCircle size={13} className="text-gray-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{expiredJobs.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Last 90 days</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[
          { key: "active",   label: `Active (${activeJobs.filter(j => j.warrantyStatus === "active" && !expiringSoon.find(e => e._id === j._id)).length})` },
          { key: "expiring", label: `Expiring Soon (${expiringSoon.length})` },
          { key: "expired",  label: `Expired (${expiredJobs.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              tab === t.key
                ? "bg-brand-500 text-white"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Jobs list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
          </div>
        ) : error ? (
          <p className="text-red-600 dark:text-red-400 text-sm p-5">{error}</p>
        ) : displayJobs.length === 0 ? (
          <div className="py-16 text-center">
            <FaShieldAlt size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No warranties in this category</p>
            <p className="text-gray-600 text-sm mt-1">
              {tab === "active"   ? "No active warranties right now." :
               tab === "expiring" ? "No warranties expiring within 7 days." :
               "No expired warranties in the last 90 days."}
            </p>
          </div>
        ) : (
          <div>
            {displayJobs.map(job => (
              <JobWarrantyRow
                key={job._id}
                job={job}
                warrantyStatus={tab === "expired" ? "expired" : job.warrantyStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
