"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FaWrench, FaSync, FaClock, FaExclamationTriangle } from "react-icons/fa";
import { useJobs } from "@/hooks/queries/usePosJobs";

const STATUS_COLORS = {
  received:           "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  diagnosing:         "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  waiting_for_parts:  "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  repairing:          "bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/30",
  ready:              "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  collected:          "bg-gray-500/15 text-gray-500 dark:text-gray-400 border-gray-500/30",
  cancelled:          "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

const ACTIVE_STATUSES = ["received", "diagnosing", "waiting_for_parts", "repairing", "ready"];

function JobRow({ job }) {
  return (
    <Link
      href={`/dashboard/pos/jobs/${job._id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">{job.jobNumber}</span>
          {job.priority === "urgent" && (
            <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full">
              <FaExclamationTriangle size={8} /> Urgent
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize flex-shrink-0 ${STATUS_COLORS[job.status] || "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
        {job.status.replace(/_/g, " ")}
      </span>
    </Link>
  );
}

const Spinner = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-slate-700 border-t-brand-400 rounded-full animate-spin" />
  </div>
);

// POS root: technician/admin see the repair (My Jobs) view here; other roles
// are redirected to their own landing.
export default function PosRoot() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab,     setTab]     = useState("mine"); // 'mine' | 'all'

  const showJobs = !!user && ["technician", "admin", "staff"].includes(user.role);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login?redirect=/dashboard/pos"); return; }
    if (!["technician", "admin"].includes(user.role)) { router.replace("/dashboard"); }
  }, [user, authLoading, router]);

  const mineQ = useJobs({ assignedTo: "me", limit: 100 }, { enabled: showJobs });
  const allQ  = useJobs({ limit: 100 }, { enabled: showJobs });
  const myJobs  = mineQ.data?.data ?? [];
  const allJobs = (allQ.data?.data ?? []).filter(j => ACTIVE_STATUSES.includes(j.status));
  const loading = mineQ.isLoading || allQ.isLoading;
  const fetchJobs = () => { mineQ.refetch(); allQ.refetch(); };

  // While redirecting a non-technician/admin role (or auth loading), show a spinner.
  if (authLoading || !user || !showJobs) return <Spinner />;

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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Welcome, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Technician · Repair Dashboard</p>
        </div>
        <button
          onClick={fetchJobs}
          className="w-9 h-9 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <FaSync size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "New / Waiting",  value: counts.received, color: "text-blue-600 dark:text-blue-400" },
          { label: "In Progress",    value: counts.active,   color: "text-brand-600 dark:text-brand-400" },
          { label: "Ready",          value: counts.ready,    color: "text-green-600 dark:text-green-400" },
          { label: "Urgent",         value: counts.urgent,   color: "text-red-600 dark:text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 p-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-fit">
        {[
          { key: "mine", label: `My Jobs (${myJobs.length})` },
          { key: "all",  label: `All Active (${allJobs.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === t.key
                ? "bg-brand-500 text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
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
                <div className="px-5 py-2.5 bg-gray-100/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Active · {activeJobs.length}</p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {activeJobs.map(job => <JobRow key={job._id} job={job} />)}
                </div>
              </div>
            )}

            {/* Completed jobs */}
            {completedJobs.length > 0 && (
              <div>
                <div className="px-5 py-2.5 bg-gray-100/30 dark:bg-gray-800/30 border-t border-b border-gray-200 dark:border-gray-800">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Completed · {completedJobs.length}</p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800 opacity-60">
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
