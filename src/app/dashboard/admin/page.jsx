"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FaServer, FaGlobe, FaUsers, FaMoneyBillWave,
  FaArrowUp, FaArrowDown, FaExclamationTriangle,
  FaRedo, FaChevronRight, FaSpinner, FaCalendarAlt,
  FaTools,
} from "react-icons/fa";

function fmt(n) {
  if (n == null) return "—";
  return `GH₵${Number(n).toLocaleString("en-GH", { minimumFractionDigits: 0 })}`;
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtNum(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString();
}

function KpiCard({ icon: Icon, label, value, sub, accent, growth }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent || "bg-gray-100"}`}>
          <Icon size={17} className="text-white" />
        </div>
        {growth != null && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${growth >= 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
            {growth >= 0 ? <FaArrowUp size={9} /> : <FaArrowDown size={9} />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-300 dark:text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

const statusColors = {
  pending:  "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  paid:     "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  active:   "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled:"bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  failed:   "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  completed:"bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const consultationStatusColors = {
  new:      "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  read:     "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  replied:  "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  archived: "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400",
};

export default function AdminOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState({ total: 0, new: 0, recent: [] });

  // ── Maintenance state ────────────────────────────────────────────────────────
  const [maint, setMaint]           = useState(null);   // settings from backend
  const [maintSaving, setMaintSaving] = useState(false);
  const [maintMsg, setMaintMsg]     = useState("");
  const [maintStart, setMaintStart] = useState("");
  const [maintEnd, setMaintEnd]     = useState("");
  const [maintExpanded, setMaintExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, contactsRes] = await Promise.all([
        api.get("/hosting/orders/admin-overview"),
        api.get("/contacts?type=consultation"),
      ]);
      setData(overviewRes.data);
      const all = contactsRes.data || [];
      setConsultations({
        total: all.length,
        new: all.filter((c) => c.status === "new").length,
        recent: all.slice(0, 5),
      });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

  const fetchMaintenance = useCallback(async () => {
    try {
      const json = await api.get("/settings");
      if (json.success) {
        const s = json.data;
        setMaint(s);
        setMaintMsg(s.maintenanceMessage   || "");
        setMaintStart(s.maintenanceScheduledStart ? new Date(s.maintenanceScheduledStart).toISOString().slice(0, 16) : "");
        setMaintEnd(s.maintenanceScheduledEnd   ? new Date(s.maintenanceScheduledEnd).toISOString().slice(0, 16)   : "");
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === "admin") fetchMaintenance();
  }, [authLoading, user?.role, fetchMaintenance]);

  const toggleMaintenance = async () => {
    if (!maint) return;
    setMaintSaving(true);
    try {
      const json = await api.patch("/settings", { maintenanceMode: !maint.maintenanceMode });
      if (json.success) setMaint(json.data);
    } catch {}
    finally { setMaintSaving(false); }
  };

  const saveMaintSchedule = async (e) => {
    e.preventDefault();
    setMaintSaving(true);
    try {
      const json = await api.patch("/settings", {
        maintenanceMessage:        maintMsg,
        maintenanceScheduledStart: maintStart || null,
        maintenanceScheduledEnd:   maintEnd   || null,
      });
      if (json.success) { setMaint(json.data); setMaintExpanded(false); }
    } catch {}
    finally { setMaintSaving(false); }
  };

  const clearSchedule = async () => {
    setMaintSaving(true);
    try {
      const json = await api.patch("/settings", {
        maintenanceScheduledStart: null,
        maintenanceScheduledEnd:   null,
      });
      if (json.success) {
        setMaint(json.data);
        setMaintStart("");
        setMaintEnd("");
      }
    } catch {}
    finally { setMaintSaving(false); }
  };

  if (authLoading) return null;

  const d = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 pt-24 pb-24">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Admin Overview</h1>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Revenue, orders, users — all in one place.</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500 transition disabled:opacity-50"
          >
            <FaRedo size={11} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* ── Maintenance Mode Card ──────────────────────────────────────────── */}
        {maint && (
          <div className={`rounded-2xl border mb-6 overflow-hidden ${
            maint.maintenanceActive
              ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
              : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900"
          }`}>
            {/* Header row */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  maint.maintenanceActive ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700"
                }`}>
                  <FaTools size={14} className={maint.maintenanceActive ? "text-white" : "text-gray-500 dark:text-slate-400"} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Maintenance Mode
                    {maint.maintenanceActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                        ACTIVE
                      </span>
                    )}
                    {maint.maintenanceScheduledStart && !maint.maintenanceActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-white">
                        SCHEDULED
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                    {maint.maintenanceActive
                      ? "Site is in maintenance — visitors see the maintenance page"
                      : "Site is live — toggle to put it in maintenance mode"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Expand / collapse schedule settings */}
                <button
                  onClick={() => setMaintExpanded((v) => !v)}
                  className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 transition font-medium"
                >
                  {maintExpanded ? "Hide settings ↑" : "Schedule / message ↓"}
                </button>
                {/* Main toggle switch */}
                <button
                  onClick={toggleMaintenance}
                  disabled={maintSaving}
                  className={`relative inline-flex w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                    maint.maintenanceMode ? "bg-red-500" : "bg-gray-200 dark:bg-slate-700"
                  } disabled:opacity-50`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    maint.maintenanceMode ? "translate-x-6" : "translate-x-0"
                  }`} />
                </button>
              </div>
            </div>

            {/* Expandable schedule + message form */}
            {maintExpanded && (
              <form onSubmit={saveMaintSchedule} className="px-5 pb-5 border-t border-gray-100 dark:border-slate-800 pt-4 space-y-4">
                {/* Message */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 block mb-1">
                    Maintenance message (shown to visitors)
                  </label>
                  <textarea
                    value={maintMsg}
                    onChange={(e) => setMaintMsg(e.target.value)}
                    rows={2}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 transition resize-none"
                    placeholder="We're performing scheduled maintenance. We'll be back shortly!"
                  />
                </div>

                {/* Schedule window */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 block mb-1">
                      Start (auto-activate)
                    </label>
                    <input
                      type="datetime-local"
                      value={maintStart}
                      onChange={(e) => setMaintStart(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 block mb-1">
                      End (auto-deactivate + countdown)
                    </label>
                    <input
                      type="datetime-local"
                      value={maintEnd}
                      onChange={(e) => setMaintEnd(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                </div>

                {/* Warn when start is set without an end — site will stay in maintenance forever */}
                {maintStart && !maintEnd && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <FaExclamationTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      <strong>No end time set.</strong> Once the start time passes, maintenance will stay active indefinitely until you turn it off manually.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 justify-end">
                  {(maint.maintenanceScheduledStart || maint.maintenanceScheduledEnd) && (
                    <button
                      type="button"
                      onClick={clearSchedule}
                      disabled={maintSaving}
                      className="text-xs font-semibold px-3 py-2 rounded-full border border-red-200 dark:border-red-800 text-red-500 hover:border-red-400 transition disabled:opacity-50"
                    >
                      Clear schedule
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={maintSaving}
                    className="text-xs font-bold px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-white transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {maintSaving ? <FaSpinner size={10} className="animate-spin" /> : null}
                    Save settings
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Quick nav */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { href: "/dashboard/admin/consultations", label: consultations.new > 0 ? `Consultations (${consultations.new} new)` : "Consultations" },
            { href: "/dashboard/admin/chats",         label: "Chat Sessions" },
            { href: "/dashboard/admin/reviews",       label: "Reviews" },
            { href: "/dashboard/admin/blog",          label: "Blog Posts" },
            { href: "/dashboard/admin/hosting",       label: "Hosting Orders" },
            { href: "/dashboard/admin/domains",       label: "Domain Orders" },
            { href: "/dashboard/admin/users",         label: "Users" },
            { href: "/dashboard/admin/emails",        label: "Email Logs" },
          ].map(({ href, label }) => (
            <Link key={href} href={href}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-amber-700/50 hover:text-amber-700 dark:hover:text-amber-400 transition">
              {label} →
            </Link>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400 dark:text-slate-500">
            <FaSpinner className="animate-spin text-2xl text-amber-500" />
            <span className="text-sm">Loading overview…</span>
          </div>
        ) : !d ? (
          <div className="text-center py-24 text-gray-400 dark:text-slate-500 text-sm">Failed to load data. <button onClick={fetchData} className="text-amber-500 underline">Retry</button></div>
        ) : (
          <>
            {/* Alerts */}
            {(d.hosting?.expiringIn7Days > 0 || d.hosting?.pending > 0 || consultations.new > 0) && (
              <div className="mb-6 space-y-2">
                {consultations.new > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-violet-200 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-900/20 px-4 py-3 text-sm text-violet-900 dark:text-violet-300">
                    <FaCalendarAlt className="shrink-0 text-violet-500" size={14} />
                    <span><strong>{consultations.new}</strong> new consultation booking{consultations.new > 1 ? "s" : ""} — <Link href="/dashboard/admin/consultations" className="underline">review now</Link></span>
                  </div>
                )}
                {d.hosting?.pending > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-300">
                    <FaExclamationTriangle className="shrink-0 text-amber-500" size={14} />
                    <span><strong>{d.hosting.pending}</strong> hosting order{d.hosting.pending > 1 ? "s" : ""} pending review — <Link href="/dashboard/admin/hosting" className="underline">review now</Link></span>
                  </div>
                )}
                {d.hosting?.expiringIn7Days > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-900 dark:text-red-300">
                    <FaExclamationTriangle className="shrink-0 text-red-500" size={14} />
                    <span><strong>{d.hosting.expiringIn7Days}</strong> active hosting account{d.hosting.expiringIn7Days > 1 ? "s" : ""} expiring within 7 days.</span>
                  </div>
                )}
              </div>
            )}

            {/* KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KpiCard icon={FaMoneyBillWave} label="Total Revenue" value={fmt(d.revenue?.total)} sub={`Hosting ${fmt(d.revenue?.hosting)} · Domains ${fmt(d.revenue?.domains)}`} accent="bg-amber-500" growth={d.revenue?.growth} />
              <KpiCard icon={FaMoneyBillWave} label="Revenue This Month" value={fmt(d.revenue?.thisMonth)} sub={`Last month: ${fmt(d.revenue?.lastMonth)}`} accent="bg-amber-400" />
              <KpiCard icon={FaServer} label="Active Hosting" value={fmtNum(d.hosting?.active)} sub={`${fmtNum(d.hosting?.total)} total orders`} accent="bg-emerald-500" />
              <KpiCard icon={FaUsers} label="Total Users" value={fmtNum(d.users?.total)} sub={`+${fmtNum(d.users?.thisMonth)} this month`} accent="bg-blue-500" />
              <KpiCard icon={FaGlobe} label="Domain Orders" value={fmtNum(d.domains?.total)} sub={`+${fmtNum(d.domains?.thisMonth)} this month`} accent="bg-violet-500" />
              <KpiCard icon={FaServer} label="Hosting This Month" value={fmtNum(d.hosting?.thisMonth)} sub={`Last month: ${fmtNum(d.hosting?.lastMonth)}`} accent="bg-gray-700" />
              <KpiCard icon={FaServer} label="Pending Orders" value={fmtNum(d.hosting?.pending)} sub="Awaiting payment verification" accent="bg-amber-600" />
              <KpiCard icon={FaExclamationTriangle} label="Expiring Soon" value={fmtNum(d.hosting?.expiringIn7Days)} sub="Active accounts expiring in 7 days" accent="bg-red-500" />
              <KpiCard icon={FaCalendarAlt} label="Consultations" value={fmtNum(consultations.total)} sub={consultations.new > 0 ? `${consultations.new} new — needs reply` : "All up to date"} accent="bg-violet-500" growth={null} />
            </div>

            {/* Recent Consultations */}
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden mb-6">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt size={13} className="text-violet-500" />
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Consultations</h2>
                  {consultations.new > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">{consultations.new} new</span>
                  )}
                </div>
                <Link href="/dashboard/admin/consultations" className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1">
                  Manage all <FaChevronRight size={9} />
                </Link>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-slate-800">
                {consultations.recent.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-slate-500 px-5 py-6 text-center">No consultation bookings yet</p>
                ) : consultations.recent.map((c) => (
                  <Link
                    key={c._id}
                    href="/dashboard/admin/consultations"
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        {c.service && <span className="text-amber-500 font-medium">{c.service} · </span>}
                        {c.email} · {fmtDate(c.createdAt)}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${consultationStatusColors[c.status] || "bg-gray-50 text-gray-500"}`}>
                      {c.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent orders */}
            <div className="grid lg:grid-cols-2 gap-6">

              {/* Recent hosting orders */}
              <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-slate-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Hosting Orders</h2>
                  <Link href="/dashboard/admin/hosting" className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1">View all <FaChevronRight size={9} /></Link>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-slate-800">
                  {(d.recentHostingOrders || []).length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-slate-500 px-5 py-6 text-center">No orders yet</p>
                  ) : (d.recentHostingOrders || []).map((o) => (
                    <Link key={o._id} href={`/dashboard/hosting/${o._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{o.planType} — {o.tier}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{o.customer?.email} · {fmtDate(o.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">GH₵{o.amount}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[o.status] || "bg-gray-50 text-gray-500"}`}>{o.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recent domain orders */}
              <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-slate-800">
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Domain Orders</h2>
                  <Link href="/dashboard/admin/domains" className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1">View all <FaChevronRight size={9} /></Link>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-slate-800">
                  {(d.recentDomainOrders || []).length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-slate-500 px-5 py-6 text-center">No domain orders yet</p>
                  ) : (d.recentDomainOrders || []).map((o) => (
                    <div key={o._id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">{o.domain}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{o.email} · {fmtDate(o.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">GH₵{o.price}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[o.status] || "bg-gray-50 text-gray-500"}`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
