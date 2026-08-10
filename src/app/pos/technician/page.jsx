"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { FaWrench, FaSync, FaClock, FaExclamationTriangle } from "react-icons/fa";

const STATUS_COLORS = {
  received:           "bg-blue-500/15 text-blue-400 border-blue-500/30",
  diagnosing:         "bg-purple-500/15 text-purple-400 border-purple-500/30",
  waiting_for_parts:  "bg-orange-500/15 text-orange-400 border-orange-500/30",
  repairing:          "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ready:              "bg-green-500/15 text-green-400 border-green-500/30",
  collected:          "bg-gray-500/15 text-gray-400 border-gray-500/30",
  cancelled:          "bg-red-500/15 text-red-400 border-red-500/30",
};

const ACTIVE_STATUSES = ["received", "diagnosing", "waiting_for_parts", "repairing", "ready"];

function JobRow({ job }) {
  return (
    <Link
      href={`/pos/jobs/${job._id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/50 transition"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-mono font-semibold text-white">{job.jobNumber}</span>
          {job.priority === "urgent" && (
            <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">
              <FaExclamationTriangle size={8} /> Urgent
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">
          {job.customer?.phone}
          {(job.deviceBrand || job.deviceModel) && (
            <span className="ml-2 text-gray-500">
              · {[job.deviceBrand, job.deviceModel].filter(Boolean).join(" ")}
            </span>
          )}
        </p>
        <p className="text-xs text-gray-600 truncate mt-0.5">{job.faultDescription}</p>
      </div>
      {job.estimatedCompletion && (
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0">
          <FaClock size={10} />
          {new Date(job.estimatedCompletion).toLocaleDateString("en-GH", { dateStyle: "medium" })}
        </div>
      )}
      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize flex-shrink-0 ${STATUS_COLORS[job.status] || "bg-gray-700 text-gray-300"}`}>
        {job.status.replace(/_/g, " ")}
      </span>
    </Link>
  );
}

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [myJobs,    setMyJobs]    = useState([]);
  const [allJobs,   setAllJobs]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("mine"); // 'mine' | 'all'

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const [mine, all] = await Promise.all([
        api.get("/pos/jobs?assignedTo=me&limit=100"),
        api.get("/pos/jobs?limit=100"),
      ]);
      setMyJobs(mine.data || []);
      setAllJobs((all.data || []).filter(j => ACTIVE_STATUSES.includes(j.status)));
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const jobs = tab === "mine" ? myJobs : allJobs;
  const activeJobs    = jobs.filter(j => ACTIVE_STATUSES.includes(j.status));
  const completedJobs = jobs.filter(j => !ACTIVE_STATUSES.includes(j.status));

  const counts = {
    received: myJobs.filter(j => j.status === "received").length,
    active:   myJobs.filter(j => ["diagnosing","repairing","waiting_for_parts"].includes(j.status)).length,
    ready:    myJobs.filter(j => j.status === "ready").length,
    urgent:   myJobs.filter(j => j.priority === "urgent").length,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            Welcome, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Technician · Repair Dashboard</p>
        </div>
        <button
          onClick={fetchJobs}
          className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition"
        >
          <FaSync size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "New / Waiting",  value: counts.received, color: "text-blue-400" },
          { label: "In Progress",    value: counts.active,   color: "text-amber-400" },
          { label: "Ready",          value: counts.ready,    color: "text-green-400" },
          { label: "Urgent",         value: counts.urgent,   color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl w-fit">
        {[
          { key: "mine", label: `My Jobs (${myJobs.length})` },
          { key: "all",  label: `All Active (${allJobs.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === t.key
                ? "bg-amber-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <FaWrench size={24} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{tab === "mine" ? "No jobs assigned to you." : "No active jobs."}</p>
          </div>
        ) : (
          <div>
            {/* Active jobs */}
            {activeJobs.length > 0 && (
              <div>
                <div className="px-5 py-2.5 bg-gray-800/50 border-b border-gray-800">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active · {activeJobs.length}</p>
                </div>
                <div className="divide-y divide-gray-800">
                  {activeJobs.map(job => <JobRow key={job._id} job={job} />)}
                </div>
              </div>
            )}

            {/* Completed jobs */}
            {completedJobs.length > 0 && (
              <div>
                <div className="px-5 py-2.5 bg-gray-800/30 border-t border-b border-gray-800">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Completed · {completedJobs.length}</p>
                </div>
                <div className="divide-y divide-gray-800 opacity-60">
                  {completedJobs.map(job => <JobRow key={job._id} job={job} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
