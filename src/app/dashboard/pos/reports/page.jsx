"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  FaChartBar, FaMoneyBillWave, FaWrench, FaUsers,
  FaExclamationTriangle, FaCheckCircle, FaSpinner, FaReceipt, FaBalanceScale,
} from "react-icons/fa";

const STATUS_COLORS = {
  received:          "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  diagnosing:        "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  waiting_for_parts: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  repairing:         "bg-brand-500/20 text-brand-600 dark:text-brand-400",
  ready:             "bg-green-500/20 text-green-600 dark:text-green-400",
  collected:         "bg-gray-500/20 text-gray-500 dark:text-gray-400",
  cancelled:         "bg-red-500/20 text-red-600 dark:text-red-400",
};

const METHOD_ICONS = {
  cash: "💵",
  momo: "📱",
  card: "💳",
};

const PRESETS = [
  { label: "Today",      days: 0 },
  { label: "7 days",     days: 7 },
  { label: "30 days",    days: 30 },
  { label: "90 days",    days: 90 },
  { label: "All time",   days: null },
];

function Stat({ label, value, sub, color = "text-gray-900 dark:text-white", icon: Icon }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        {Icon && <Icon size={14} className={`${color} opacity-60`} />}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset,  setPreset]  = useState("30 days");
  const [from,    setFrom]    = useState("");
  const [to,      setTo]      = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to)   params.set("to",   to);
      const res = await api.get(`/pos/overview?${params}`);
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const applyPreset = (p) => {
    setPreset(p.label);
    if (p.days === null) { setFrom(""); setTo(""); return; }
    if (p.days === 0) {
      const d = new Date().toISOString().slice(0, 10);
      setFrom(d); setTo(d); return;
    }
    const t = new Date();
    const f = new Date(t); f.setDate(t.getDate() - p.days);
    setFrom(f.toISOString().slice(0, 10));
    setTo(t.toISOString().slice(0, 10));
  };

  const stats      = data?.stats;
  const daily      = data?.dailyRevenue      || [];
  const methods    = data?.paymentMethods    || [];
  const byStatus   = data?.jobsByStatus      || [];
  const topParts   = data?.topParts          || [];
  const techs      = data?.techPerformance   || [];
  const recent     = data?.recentJobs        || [];
  const expenseCats   = data?.expenseByCategory || [];
  const topProfitJobs = data?.topProfitJobs    || [];

  const maxDailyRevenue = Math.max(...daily.map(d => d.total), 1);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Shop performance overview</p>
        </div>
        {loading && <FaSpinner className="animate-spin text-brand-600 dark:text-brand-400" size={16} />}
      </div>

      {/* Date range */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                preset === p.label
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={from}
              onChange={e => { setFrom(e.target.value); setPreset("custom"); }}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
            <span className="text-gray-500 text-xs">to</span>
            <input
              type="date"
              value={to}
              onChange={e => { setTo(e.target.value); setPreset("custom"); }}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Key stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Total Revenue"     value={`GH₵${((stats?.totalRevenue || 0) / 100).toLocaleString()}`}  color="text-green-600 dark:text-green-400"  icon={FaMoneyBillWave} sub={`${stats?.totalPayments || 0} payments`} />
            <Stat label="Today's Revenue"   value={`GH₵${((stats?.todayRevenue  || 0) / 100).toLocaleString()}`} color="text-brand-600 dark:text-brand-400"  icon={FaChartBar}      sub="Payments today" />
            <Stat label="Total Jobs"        value={stats?.totalJobs}        icon={FaWrench}    sub="All time" />
            <Stat label="New Today"         value={stats?.todayJobs}        icon={FaWrench}    sub="Jobs created today" color="text-blue-600 dark:text-blue-400" />
            <Stat label="In Progress"       value={stats?.pendingJobs}      icon={FaSpinner}   color="text-brand-600 dark:text-brand-400" sub="Active repairs" />
            <Stat label="Ready to Collect"  value={stats?.readyJobs}        icon={FaCheckCircle} color="text-green-600 dark:text-green-400" sub="Awaiting pickup" />
            <Stat label="Customers"         value={stats?.totalCustomers}   icon={FaUsers}     sub="Registered" />
            <Stat label="Low Stock"         value={stats?.lowStockCount}    icon={FaExclamationTriangle} color={stats?.lowStockCount > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"} sub="Parts below threshold" />
            <Stat label="Total Expenses"    value={`GH₵${((stats?.totalExpenses || 0) / 100).toLocaleString()}`} color="text-red-600 dark:text-red-400" icon={FaReceipt} sub="Running costs" />
            <Stat
              label="Net Profit"
              value={`GH₵${((stats?.netProfit || 0) / 100).toLocaleString()}`}
              color={(stats?.netProfit || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
              icon={FaBalanceScale}
              sub="Revenue minus expenses"
            />
          </div>

          {/* Revenue chart */}
          {daily.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">Daily Revenue</h2>
              <div className="flex items-end gap-1.5 h-40 overflow-x-auto pb-1">
                {daily.map(day => (
                  <div key={day._id} className="flex-1 min-w-[28px] flex flex-col items-center gap-1.5">
                    <p className="text-xs text-gray-600 whitespace-nowrap" style={{ fontSize: "9px" }}>
                      GH₵{day.total >= 100000 ? `${(day.total/100000).toFixed(1)}k` : (day.total/100).toLocaleString()}
                    </p>
                    <div
                      className="w-full rounded-t-lg bg-brand-500/70 hover:bg-brand-500 transition"
                      title={`GH₵${(day.total/100).toLocaleString()} · ${day.count} payment${day.count !== 1 ? "s" : ""}`}
                      style={{ height: `${Math.max(4, (day.total / maxDailyRevenue) * 100)}%` }}
                    />
                    <span className="text-gray-600 whitespace-nowrap" style={{ fontSize: "9px" }}>
                      {new Date(day._id + "T00:00:00").toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses breakdown */}
          {expenseCats.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Expenses by Category</h2>
                <Link href="/dashboard/pos/expenses" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">Manage →</Link>
              </div>
              <div className="space-y-3">
                {expenseCats.map(e => {
                  const totalExp = expenseCats.reduce((s, x) => s + x.total, 0);
                  const pct = totalExp > 0 ? Math.round((e.total / totalExp) * 100) : 0;
                  return (
                    <div key={e._id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-300 capitalize">{e._id}</span>
                        <span className="text-gray-500 dark:text-gray-400">GH₵{(e.total/100).toLocaleString()} · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-red-400/60" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Expenses</span>
                <span className="text-red-600 dark:text-red-400 font-semibold">GH₵{((stats?.totalExpenses || 0) / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500 dark:text-gray-400">Net Profit</span>
                <span className={`font-bold ${(stats?.netProfit || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  GH₵{((stats?.netProfit || 0) / 100).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            {/* Payment methods */}
            {methods.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Payment Methods</h2>
                <div className="space-y-3">
                  {methods.map(m => {
                    const total = methods.reduce((s, x) => s + x.total, 0);
                    const pct   = total > 0 ? Math.round((m.total / total) * 100) : 0;
                    return (
                      <div key={m._id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-300 capitalize flex items-center gap-1.5">
                            {METHOD_ICONS[m._id] || "💳"} {m._id}
                            <span className="text-xs text-gray-500">({m.count})</span>
                          </span>
                          <span className="text-gray-900 dark:text-white font-semibold">GH₵{(m.total/100).toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                          <div className="h-1.5 rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Jobs by status */}
            {byStatus.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Jobs by Status</h2>
                <div className="space-y-2">
                  {byStatus.map(s => (
                    <div key={s._id} className="flex items-center justify-between">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[s._id] || "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                        {s._id.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top parts used */}
            {topParts.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Top Parts Used</h2>
                <div className="space-y-2.5">
                  {topParts.map((p, i) => {
                    const margin = p.revenue > 0 ? Math.round(((p.revenue - (p.cost||0)) / p.revenue) * 100) : 0;
                    return (
                      <div key={p._id} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-4 text-right">{i + 1}</span>
                        <span className="flex-1 text-sm text-gray-600 dark:text-gray-300 truncate">{p._id}</span>
                        <span className="text-xs text-gray-500">{p.timesUsed}×</span>
                        <span className={`text-xs font-medium w-12 text-right ${margin >= 40 ? "text-green-600 dark:text-green-400" : margin >= 20 ? "text-brand-600 dark:text-brand-400" : "text-red-600 dark:text-red-400"}`}>{margin}%</span>
                        <span className="text-sm text-brand-600 dark:text-brand-400 font-semibold w-24 text-right">GH₵{(p.revenue/100).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Most profitable jobs */}
            {topProfitJobs.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Most Profitable Jobs</h2>
                <div className="space-y-3">
                  {topProfitJobs.map((job, i) => {
                    const pct = job.totalRevenue > 0 ? Math.round((job.grossProfit / job.totalRevenue) * 100) : 0;
                    return (
                      <Link key={job._id} href={`/dashboard/pos/jobs/${job._id}`} className="block hover:opacity-80 transition">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                            <span className="text-xs font-mono text-brand-600 dark:text-brand-400">{job.jobNumber}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.customer?.name}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`text-xs font-semibold ${pct >= 50 ? "text-green-600 dark:text-green-400" : pct >= 25 ? "text-brand-600 dark:text-brand-400" : "text-red-600 dark:text-red-400"}`}>{pct}%</span>
                            <span className="text-sm font-bold text-green-600 dark:text-green-400 w-24 text-right">GH₵{(job.grossProfit/100).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 50 ? "bg-green-500/60" : pct >= 25 ? "bg-brand-500/60" : "bg-red-500/60"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Technician performance */}
            {techs.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Technician Performance</h2>
                <div className="space-y-3">
                  {techs.map(t => {
                    const pct = t.jobCount > 0 ? Math.round((t.completed / t.jobCount) * 100) : 0;
                    return (
                      <div key={t._id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-300">{t.name}</span>
                          <span className="text-xs text-gray-500">{t.completed}/{t.jobCount} completed ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                          <div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Recent jobs */}
          {recent.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Repairs</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {recent.map(job => {
                  const jobTotal = (job.diagnosisFee || 0) + (job.laborCost || 0) +
                    (job.parts?.reduce((s, p) => s + (p.priceAtTime || 0) * (p.quantity || 1), 0) || 0);
                  return (
                    <Link
                      key={job._id}
                      href={`/dashboard/pos/jobs/${job._id}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-100/40 dark:hover:bg-gray-800/40 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono text-brand-600 dark:text-brand-400">{job.jobNumber}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[job.status] || "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                            {job.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {job.customer?.phone} · {[job.deviceBrand, job.deviceModel].filter(Boolean).join(" ") || "—"}
                          {job.assignedTo && <span className="ml-2 text-gray-600">· {job.assignedTo.name}</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">GH₵{(jobTotal/100).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{new Date(job.createdAt).toLocaleDateString("en-GH")}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
