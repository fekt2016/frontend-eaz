"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { printRepairReceipt } from "@/lib/printReceipt";
import {
  FaArrowLeft, FaWrench, FaPhone, FaUser, FaCalendarAlt,
  FaPrint, FaCheckCircle, FaClock, FaExclamationTriangle,
} from "react-icons/fa";

const STATUS_COLORS = {
  received:          "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  diagnosing:        "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  waiting_for_parts: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  repairing:         "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  ready:             "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  collected:         "bg-gray-500/15 text-gray-500 dark:text-gray-400 border-gray-500/30",
  cancelled:         "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

function jobTotal(job) {
  const parts = job.parts?.reduce((s, p) => s + (p.priceAtTime || 0) * (p.quantity || 1), 0) || 0;
  return (job.diagnosisFee || 0) + (job.laborCost || 0) + parts;
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [filter,  setFilter]  = useState("all"); // all | active | completed

  useEffect(() => {
    api.get(`/pos/customers/${id}`)
      .then(r => setData(r.data))
      .catch(e => setError(e.message || "Failed to load customer."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-700 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="text-center py-16 text-red-600 dark:text-red-400">
      {error} — <Link href="/dashboard/pos/customers" className="text-amber-600 dark:text-amber-400 hover:underline">Back</Link>
    </div>
  );

  if (!data) return (
    <div className="text-center py-16 text-gray-500">
      Customer not found. <Link href="/dashboard/pos/customers" className="text-amber-600 dark:text-amber-400 hover:underline">Back</Link>
    </div>
  );

  const { customer, jobs } = data;

  // Stats
  const totalSpent    = jobs.reduce((s, j) => s + jobTotal(j), 0);
  const completedJobs = jobs.filter(j => j.status === "collected");
  const activeJobs    = jobs.filter(j => !["collected","cancelled"].includes(j.status));

  // Devices repaired (unique brand+model combos)
  const devices = [...new Set(
    jobs.map(j => [j.deviceBrand, j.deviceModel].filter(Boolean).join(" ")).filter(Boolean)
  )];

  // Filter
  const filtered = filter === "active"    ? activeJobs
                 : filter === "completed" ? completedJobs
                 : jobs;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/pos/customers" className="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
          <FaArrowLeft size={12} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{customer.phone}</h1>
            {activeJobs.length > 0 && (
              <span className="text-xs bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                {activeJobs.length} active
              </span>
            )}
          </div>
          {customer.name && <p className="text-sm text-gray-500">{customer.name}</p>}
        </div>
        <Link
          href={`/dashboard/pos/jobs/new?customer=${customer._id}`}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition"
        >
          <FaWrench size={11} /> New Job
        </Link>
      </div>

      {/* Customer info */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <FaPhone size={11} className="text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Phone</p>
              <p className="text-sm text-gray-900 dark:text-white">{customer.phone}</p>
            </div>
          </div>
          {customer.name && (
            <div className="flex items-center gap-2">
              <FaUser size={11} className="text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Name</p>
                <p className="text-sm text-gray-900 dark:text-white">{customer.name}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <FaCalendarAlt size={11} className="text-gray-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Customer since</p>
              <p className="text-sm text-gray-900 dark:text-white">{new Date(customer.createdAt).toLocaleDateString("en-GH", { dateStyle: "medium" })}</p>
            </div>
          </div>
          {customer.address && (
            <div className="sm:col-span-3">
              <p className="text-xs text-gray-500 mb-0.5">Address</p>
              <p className="text-sm text-gray-900 dark:text-white">{customer.address}</p>
            </div>
          )}
          {customer.notes && (
            <div className="sm:col-span-3 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800">
              <p className="text-xs text-gray-500 mb-0.5">Notes</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{jobs.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Jobs</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedJobs.length}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{activeJobs.length}</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-xl font-bold text-green-600 dark:text-green-400">GH₵{totalSpent.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Total Spent</p>
        </div>
      </div>

      {/* Devices */}
      {devices.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2.5">Devices repaired</p>
          <div className="flex flex-wrap gap-2">
            {devices.map(d => (
              <span key={d} className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Repair history */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Repair History</h2>
          {/* Filter tabs */}
          <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {[
              { key: "all",       label: `All (${jobs.length})` },
              { key: "active",    label: `Active (${activeJobs.length})` },
              { key: "completed", label: `Done (${completedJobs.length})` },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  filter === t.key ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No jobs in this category.</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filtered.map(job => {
              const amount = jobTotal(job);
              return (
                <div key={job._id} className="px-5 py-4 hover:bg-gray-100/30 dark:hover:bg-gray-800/30 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        job.status === "collected" ? "bg-gray-200 dark:bg-gray-700" :
                        job.status === "cancelled" ? "bg-red-500/10" : "bg-amber-500/10"
                      }`}>
                        {job.status === "collected" ? <FaCheckCircle size={13} className="text-gray-500 dark:text-gray-400" /> :
                         job.status === "cancelled" ? <FaExclamationTriangle size={12} className="text-red-600 dark:text-red-400" /> :
                         <FaClock size={12} className="text-amber-600 dark:text-amber-400" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/dashboard/pos/jobs/${job._id}`} className="text-sm font-mono font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                            {job.jobNumber}
                          </Link>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_COLORS[job.status] || "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                            {job.status.replace(/_/g, " ")}
                          </span>
                          {job.priority === "urgent" && (
                            <span className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">Urgent</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                          {[job.deviceBrand, job.deviceModel].filter(Boolean).join(" ") || "—"}
                          <span className="text-gray-500 text-xs ml-1 capitalize">· {job.deviceType}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{job.faultDescription}</p>
                        {job.repairWork && (
                          <p className="text-xs text-amber-400/80 mt-0.5 truncate">✓ {job.repairWork}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs text-gray-600">
                            {new Date(job.createdAt).toLocaleDateString("en-GH", { dateStyle: "medium" })}
                          </span>
                          {job.assignedTo && (
                            <span className="text-xs text-gray-600">· Tech: {job.assignedTo.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-1.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">GH₵{amount.toLocaleString()}</p>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link
                          href={`/dashboard/pos/jobs/${job._id}`}
                          className="text-xs text-gray-500 hover:text-amber-400 transition"
                        >
                          View
                        </Link>
                        <span className="text-gray-700">·</span>
                        <button
                          onClick={() => printRepairReceipt({ ...job, status: job.status }, [])}
                          className="text-xs text-gray-500 hover:text-amber-400 transition flex items-center gap-1"
                        >
                          <FaPrint size={9} /> Receipt
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Parts used */}
                  {job.parts?.length > 0 && (
                    <div className="mt-2.5 ml-11 flex flex-wrap gap-1.5">
                      {job.parts.map((p, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          {p.name} ×{p.quantity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
