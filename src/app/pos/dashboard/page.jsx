"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  FaWrench, FaUsers, FaClock, FaCheckCircle,
  FaExclamationTriangle, FaPlus, FaBoxes, FaBell, FaSpinner,
} from "react-icons/fa";

const STATUS_COLORS = {
  received:   "bg-blue-500/15 text-blue-400",
  diagnosing: "bg-purple-500/15 text-purple-400",
  repairing:  "bg-amber-500/15 text-amber-400",
  ready:      "bg-green-500/15 text-green-400",
  collected:  "bg-gray-500/15 text-gray-400",
  cancelled:  "bg-red-500/15 text-red-400",
};

const STATUS_LABEL = {
  received: "Received", diagnosing: "Diagnosing", repairing: "Repairing",
  ready: "Ready", collected: "Collected", cancelled: "Cancelled",
};

function StatCard({ label, value, icon: Icon, color = "text-amber-400", sub }) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <Icon size={14} className={color} />
      </div>
      <p className={`text-3xl font-bold text-white mb-0.5`}>{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function PosDashboard() {
  const { user } = useAuth();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [uncollected,setUncollected]= useState([]);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState("");

  useEffect(() => {
    api.get("/pos/overview")
      .then(r => setData(r.data))
      .catch(e => setError(e.message || "Failed to load dashboard."))
      .finally(() => setLoading(false));

    api.get("/pos/reminders/uncollected?days=3")
      .then(r => setUncollected(r.data || []))
      .catch(() => {});
  }, []);

  const handleTriggerReminders = async () => {
    setTriggering(true); setTriggerMsg("");
    try {
      await api.post("/pos/reminders/trigger", {});
      setTriggerMsg("Reminders sent! Check server logs.");
      setTimeout(() => setTriggerMsg(""), 4000);
    } catch (e) {
      setTriggerMsg(e.message || "Failed.");
    } finally {
      setTriggering(false);
    }
  };

  const stats = data?.stats;

  if (error) return <p className="text-red-400 text-sm p-5">{error}</p>;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link
          href="/pos/jobs/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition"
        >
          <FaPlus size={11} /> New Job
        </Link>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today's Revenue"  value={`GH₵${(stats?.todayRevenue || 0).toLocaleString()}`}  icon={FaCheckCircle} color="text-green-400" sub="Payments received today" />
          <StatCard label="Total Revenue"    value={`GH₵${(stats?.totalRevenue  || 0).toLocaleString()}`}  icon={FaCheckCircle} color="text-green-400" sub="All time" />
          <StatCard label="Jobs Today"       value={stats?.todayJobs}      icon={FaWrench}           sub="New intake today" />
          <StatCard label="Total Jobs"       value={stats?.totalJobs}      icon={FaWrench}           color="text-blue-400" sub="All time" />
          <StatCard label="Pending"          value={stats?.pendingJobs}    icon={FaClock}            color="text-amber-400" sub="In progress" />
          <StatCard label="Ready"            value={stats?.readyJobs}      icon={FaCheckCircle}      color="text-green-400" sub="Waiting for collection" />
          <StatCard label="Customers"        value={stats?.totalCustomers} icon={FaUsers}            color="text-purple-400" sub="All time" />
          <StatCard label="Low Stock"        value={stats?.lowStockCount}  icon={FaBoxes}            color={stats?.lowStockCount > 0 ? "text-red-400" : "text-gray-500"} sub="Parts below threshold" />
        </div>
      )}

      {/* Revenue chart (simple bars) */}
      {data?.dailyRevenue?.length > 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Last 7 Days Revenue</h2>
          <div className="flex items-end gap-2 h-28">
            {(() => {
              const max = Math.max(...data.dailyRevenue.map(d => d.total), 1);
              return data.dailyRevenue.map(day => (
                <div key={day._id} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-md bg-amber-500/70 hover:bg-amber-500 transition"
                    style={{ height: `${(day.total / max) * 100}%`, minHeight: 4 }}
                    title={`GH₵${day.total.toLocaleString()}`}
                  />
                  <span className="text-xs text-gray-500">
                    {new Date(day._id).toLocaleDateString("en-GH", { weekday: "short" })}
                  </span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Uncollected devices alert */}
      {uncollected.length > 0 && (
        <div className="bg-gray-900 rounded-2xl border border-amber-500/30 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-2">
              <FaBell size={13} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-amber-400">
                {uncollected.length} Uncollected Device{uncollected.length !== 1 ? "s" : ""}
              </h2>
              <span className="text-xs text-gray-500">ready 3+ days ago</span>
            </div>
            {["superadmin", "admin"].includes(user?.role) && (
              <button
                onClick={handleTriggerReminders}
                disabled={triggering}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition disabled:opacity-50"
              >
                {triggering ? <FaSpinner className="animate-spin" size={10} /> : <FaBell size={10} />}
                Send Reminders
              </button>
            )}
          </div>
          {triggerMsg && <p className="text-xs text-green-400 px-5 py-2">{triggerMsg}</p>}
          <div className="divide-y divide-gray-800">
            {uncollected.map(job => (
              <Link
                key={job._id}
                href={`/pos/jobs/${job._id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/40 transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-mono font-semibold text-amber-400">{job.jobNumber}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {job.customer?.name} · {[job.deviceBrand, job.deviceModel].filter(Boolean).join(" ") || "—"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-semibold text-red-400">{job.daysWaiting}d waiting</p>
                  <p className="text-xs text-gray-600">
                    {job.remindersSent > 0 ? `${job.remindersSent} reminder${job.remindersSent !== 1 ? "s" : ""} sent` : "No reminders yet"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">Recent Jobs</h2>
          <Link href="/pos/jobs" className="text-xs text-amber-400 hover:underline">View all →</Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-gray-800 animate-pulse" />)}
          </div>
        ) : data?.recentJobs?.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No jobs yet. <Link href="/pos/jobs/new" className="text-amber-400 hover:underline">Create first job →</Link></div>
        ) : (
          <div className="divide-y divide-gray-800">
            {data?.recentJobs?.map(job => (
              <Link
                key={job._id}
                href={`/pos/jobs/${job._id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
                    <FaWrench size={11} className="text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{job.jobNumber}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {job.customer?.name} · {job.deviceBrand} {job.deviceModel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  {job.priority === "urgent" && (
                    <FaExclamationTriangle size={11} className="text-red-400" />
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[job.status] || "bg-gray-700 text-gray-300"}`}>
                    {STATUS_LABEL[job.status] || job.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
