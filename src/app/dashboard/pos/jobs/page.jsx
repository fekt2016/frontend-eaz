"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { FaPlus, FaSearch, FaWrench, FaExclamationTriangle } from "react-icons/fa";

const STATUS_TABS = [
  { key: "all",        label: "All" },
  { key: "received",   label: "Received" },
  { key: "diagnosing", label: "Diagnosing" },
  { key: "repairing",  label: "Repairing" },
  { key: "ready",      label: "Ready" },
  { key: "collected",  label: "Collected" },
  { key: "cancelled",  label: "Cancelled" },
];

const STATUS_COLORS = {
  received:   "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  diagnosing: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  repairing:  "bg-brand-500/15 text-brand-600 dark:text-brand-400",
  ready:      "bg-green-500/15 text-green-600 dark:text-green-400",
  collected:  "bg-gray-500/15 text-gray-500 dark:text-gray-400",
  cancelled:  "bg-red-500/15 text-red-600 dark:text-red-400",
};

export default function JobsPage() {
  const [jobs,    setJobs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [status,  setStatus]  = useState("all");
  const [q,       setQ]       = useState("");
  const [page,    setPage]    = useState(1);
  const limit = 20;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit });
      if (status !== "all") params.set("status", status);
      if (q.trim()) params.set("q", q.trim());
      const res = await api.get(`/pos/jobs?${params}`);
      setJobs(res.data || []);
      setTotal(res.total);
    } catch (err) {
      setError(err.message || "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, [status, q, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSearch = (e) => { setQ(e.target.value); setPage(1); };
  const handleStatus = (s) => { setStatus(s); setPage(1); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Repair Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total jobs</p>
        </div>
        <Link
          href="/dashboard/pos/jobs/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition"
        >
          <FaPlus size={11} /> New Job
        </Link>
      </div>

      {/* Search + filter */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={q}
            onChange={handleSearch}
            placeholder="Search by job #, customer name, device…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => handleStatus(t.key)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              status === t.key
                ? "bg-brand-500 text-white"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center">
            <FaWrench size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No jobs found</p>
            <p className="text-gray-600 text-sm mt-1">Try a different filter or create a new job.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-3">Job #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Device</th>
                  <th className="px-5 py-3">Fault</th>
                  <th className="px-5 py-3">Assigned</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {jobs.map(job => (
                  <tr key={job._id} className="hover:bg-gray-100/40 dark:hover:bg-gray-800/40 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {job.priority === "urgent" && <FaExclamationTriangle size={10} className="text-red-600 dark:text-red-400 flex-shrink-0" />}
                        <span className="text-xs font-mono font-semibold text-brand-600 dark:text-brand-400 whitespace-nowrap">{job.jobNumber}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900 dark:text-white truncate max-w-[160px]">{job.customer?.phone || "—"}</p>
                        {job.customerRepairCount > 1 && (
                          <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 font-medium">
                            {job.customerRepairCount}×
                          </span>
                        )}
                      </div>
                      {job.customer?.name && <p className="text-xs text-gray-500 truncate max-w-[160px]">{job.customer.name}</p>}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-300 truncate max-w-[140px]">
                      {[job.deviceBrand, job.deviceModel].filter(Boolean).join(" ").slice(0, 20) || "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                      {job.faultDescription?.slice(0, 30)}{job.faultDescription?.length > 30 ? "…" : ""}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {job.assignedTo?.name || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[job.status] || "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleDateString("en-GH")}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/dashboard/pos/jobs/${job._id}`}
                        className="inline-block text-xs font-semibold px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              ← Prev
            </button>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}