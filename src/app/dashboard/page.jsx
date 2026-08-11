"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FaServer, FaGlobe, FaShieldAlt, FaExternalLinkAlt,
  FaClock, FaChevronRight, FaUserCircle, FaUsers, FaMoneyBillWave,
  FaArrowUp, FaArrowDown, FaExclamationTriangle, FaRedo, FaSpinner,
  FaCalendarAlt, FaTools,
} from "react-icons/fa";

/* ── Personal overview helpers ─────────────────────────────────────────── */

const statusConfig = {
  active:    { label: "Active",    cls: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/30", dot: "bg-emerald-500" },
  paid:      { label: "Paid",      cls: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/30",                  dot: "bg-blue-500" },
  pending:   { label: "Pending",   cls: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/30",             dot: "bg-amber-400" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/30",                        dot: "bg-red-400" },
  failed:    { label: "Failed",    cls: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/30",                        dot: "bg-red-400" },
  completed: { label: "Active",    cls: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/30", dot: "bg-emerald-500" },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { label: status, cls: "bg-gray-50 text-gray-600 border-gray-100", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-300 dark:text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function HostingCard({ order }) {
  const isActive = order.status === "active";
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <FaServer size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{order.planType} — {order.tier}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 capitalize">{order.billingCycle} · GH₵{order.amount}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.domain && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
          <FaGlobe size={12} className="text-gray-400 dark:text-slate-500" />
          <span className="text-xs text-gray-600 dark:text-slate-300 font-mono">{order.domain}</span>
        </div>
      )}

      {isActive && order.cpanelUsername && (
        <div className="mb-4 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">cPanel Username</p>
          <p className="text-sm font-mono text-emerald-800 dark:text-emerald-300 font-semibold">{order.cpanelUsername}</p>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-500 mt-1">Open cPanel from the order page — we sign you in securely.</p>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          href={`/dashboard/hosting/${order._id}`}
          className="flex-1 text-center text-xs font-semibold py-2 rounded-full border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white transition"
        >
          View Details
        </Link>
        {isActive && order.cpanelUsername && (
          <Link
            href={`/dashboard/hosting/${order._id}`}
            className="flex-1 text-center text-xs font-semibold py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition"
          >
            Manage hosting
          </Link>
        )}
      </div>
    </div>
  );
}

function DomainCard({ order }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <FaGlobe size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{order.domain}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">{order.years} year{order.years > 1 ? "s" : ""} · GH₵{order.price}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>
    </div>
  );
}

/* ── Admin overview helpers ────────────────────────────────────────────── */

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

/* ── Admin overview section (shown to admin/superadmin) ────────────────── */

function AdminOverviewSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState({ total: 0, new: 0, recent: [] });

  const [maint, setMaint]           = useState(null);
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

  useEffect(() => { fetchData(); }, [fetchData]);

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

  useEffect(() => { fetchMaintenance(); }, [fetchMaintenance]);

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

  const d = data;

  return (
    <>
      {/* Header row + refresh */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">Business Overview</h2>
          <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5">Revenue, orders, users — all in one place.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500 transition disabled:opacity-50"
        >
          <FaRedo size={11} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Maintenance Mode Card */}
      {maint && (
        <div className={`rounded-2xl border mb-6 overflow-hidden ${
          maint.maintenanceActive
            ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
            : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900"
        }`}>
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
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">ACTIVE</span>
                  )}
                  {maint.maintenanceScheduledStart && !maint.maintenanceActive && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-white">SCHEDULED</span>
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
              <button
                onClick={() => setMaintExpanded((v) => !v)}
                className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 transition font-medium"
              >
                {maintExpanded ? "Hide settings ↑" : "Schedule / message ↓"}
              </button>
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

          {maintExpanded && (
            <form onSubmit={saveMaintSchedule} className="px-5 pb-5 border-t border-gray-100 dark:border-slate-800 pt-4 space-y-4">
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

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 block mb-1">Start (auto-activate)</label>
                  <input
                    type="datetime-local"
                    value={maintStart}
                    onChange={(e) => setMaintStart(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 block mb-1">End (auto-deactivate + countdown)</label>
                  <input
                    type="datetime-local"
                    value={maintEnd}
                    onChange={(e) => setMaintEnd(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

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
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { href: "/dashboard/consultations", label: consultations.new > 0 ? `Consultations (${consultations.new} new)` : "Consultations" },
          { href: "/dashboard/chats",         label: "Chat Sessions" },
          { href: "/dashboard/reviews",       label: "Reviews" },
          { href: "/dashboard/blog",          label: "Blog Posts" },
          { href: "/dashboard/hosting-orders",       label: "Hosting Orders" },
          { href: "/dashboard/domain-orders",       label: "Domain Orders" },
          { href: "/dashboard/users",         label: "Users" },
          { href: "/dashboard/emails",        label: "Email Logs" },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-amber-700/50 hover:text-amber-700 dark:hover:text-amber-400 transition">
            {label} →
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400 dark:text-slate-500">
          <FaSpinner className="animate-spin text-2xl text-amber-500" />
          <span className="text-sm">Loading overview…</span>
        </div>
      ) : !d ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500 text-sm">Failed to load data. <button onClick={fetchData} className="text-amber-500 underline">Retry</button></div>
      ) : (
        <>
          {/* Alerts */}
          {(d.hosting?.expiringIn7Days > 0 || d.hosting?.pending > 0 || consultations.new > 0) && (
            <div className="mb-6 space-y-2">
              {consultations.new > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-violet-200 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-900/20 px-4 py-3 text-sm text-violet-900 dark:text-violet-300">
                  <FaCalendarAlt className="shrink-0 text-violet-500" size={14} />
                  <span><strong>{consultations.new}</strong> new consultation booking{consultations.new > 1 ? "s" : ""} — <Link href="/dashboard/consultations" className="underline">review now</Link></span>
                </div>
              )}
              {d.hosting?.pending > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-300">
                  <FaExclamationTriangle className="shrink-0 text-amber-500" size={14} />
                  <span><strong>{d.hosting.pending}</strong> hosting order{d.hosting.pending > 1 ? "s" : ""} pending review — <Link href="/dashboard/hosting-orders" className="underline">review now</Link></span>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Consultations</h3>
                {consultations.new > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">{consultations.new} new</span>
                )}
              </div>
              <Link href="/dashboard/consultations" className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1">
                Manage all <FaChevronRight size={9} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-slate-800">
              {consultations.recent.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500 px-5 py-6 text-center">No consultation bookings yet</p>
              ) : consultations.recent.map((c) => (
                <Link
                  key={c._id}
                  href="/dashboard/consultations"
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
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-slate-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Hosting Orders</h3>
                <Link href="/dashboard/hosting-orders" className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1">View all <FaChevronRight size={9} /></Link>
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

            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-slate-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Domain Orders</h3>
                <Link href="/dashboard/domain-orders" className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1">View all <FaChevronRight size={9} /></Link>
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
    </>
  );
}

/* ── Dashboard (combined) ──────────────────────────────────────────────── */

function DashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isAdmin = ["admin", "superadmin"].includes(user?.role);

  const [hosting, setHosting] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loadingHosting, setLoadingHosting] = useState(true);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "hosting" || t === "domains" || t === "overview") {
      setTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    api.get("/hosting/orders")
      .then((res) => setHosting(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingHosting(false));

    api.get("/domain/orders")
      .then((res) => setDomains(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingDomains(false));
  }, []);

  const activeHosting = hosting.filter(o => o.status === "active").length;
  const activeDomains = domains.filter(o => o.status === "completed").length;
  const pendingOrders = [...hosting, ...domains].filter(o => o.status === "pending").length;

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "hosting", label: "Hosting" },
    { id: "domains", label: "Domains" },
  ];

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <FaUserCircle size={24} className="text-amber-500" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
                {user?.name ? `Hey, ${user.name.split(" ")[0]} 👋` : "Dashboard"}
              </h1>
              <p className="text-sm text-gray-400 dark:text-slate-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/settings" className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500 transition">
              <FaUserCircle size={12} /> Settings
            </Link>
          </div>
        </div>

        {/* Admin / business overview — admin & superadmin only */}
        {isAdmin && (
          <div className="mb-10">
            <AdminOverviewSection />
          </div>
        )}

        {/* Personal overview — regular users only. Admins get the admin overview above plus the dedicated pages. */}
        {!isAdmin && (
          <div>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard icon={FaServer} label="Active Hosting" value={activeHosting} color="bg-amber-400" />
            <StatCard icon={FaGlobe} label="Active Domains" value={activeDomains} color="bg-blue-500" />
            <StatCard icon={FaClock} label="Pending Orders" value={pendingOrders} color="bg-gray-400" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-1 w-fit">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
                  tab === item.id ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === "overview" && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Recent Hosting */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Recent Hosting</h2>
                  <button onClick={() => setTab("hosting")} className="text-xs text-amber-500 hover:underline flex items-center gap-1">
                    View all <FaChevronRight size={9} />
                  </button>
                </div>
                {loadingHosting ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 flex justify-center">
                    <div className="w-5 h-5 border-2 border-gray-200 dark:border-slate-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
                  </div>
                ) : hosting.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 text-center">
                    <p className="text-gray-400 dark:text-slate-500 text-sm mb-3">No hosting orders yet.</p>
                    <Link href="/hosting" className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                      Browse Plans
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {hosting.slice(0, 2).map(o => <HostingCard key={o._id} order={o} />)}
                  </div>
                )}
              </div>

              {/* Recent Domains */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Recent Domains</h2>
                  <button onClick={() => setTab("domains")} className="text-xs text-amber-500 hover:underline flex items-center gap-1">
                    View all <FaChevronRight size={9} />
                  </button>
                </div>
                {loadingDomains ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 flex justify-center">
                    <div className="w-5 h-5 border-2 border-gray-200 dark:border-slate-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
                  </div>
                ) : domains.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 text-center">
                    <p className="text-gray-400 dark:text-slate-500 text-sm mb-3">No domains registered yet.</p>
                    <Link href="/domains" className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                      Search Domains
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {domains.slice(0, 3).map(o => <DomainCard key={o._id} order={o} />)}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="md:col-span-2">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { href: "/hosting", icon: FaServer, label: "Order Hosting", color: "text-amber-500 bg-amber-50" },
                    { href: "/domains", icon: FaGlobe, label: "Register Domain", color: "text-blue-500 bg-blue-50" },
                    { href: "/contact", icon: FaShieldAlt, label: "Get Support", color: "text-emerald-500 bg-emerald-50" },
                    {
                      href: "/dashboard?tab=hosting",
                      icon: FaExternalLinkAlt,
                      label: "cPanel (my orders)",
                      color: "text-purple-500 bg-purple-50",
                    },
                  ].map(({ href, icon: Icon, label, color }) => (
                    <Link
                      key={label}
                      href={href}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 flex flex-col items-center gap-2 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition text-center"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                        <Icon size={16} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-slate-300">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hosting tab */}
          {tab === "hosting" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900 dark:text-white">All Hosting Orders</h2>
                <Link href="/hosting" className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                  + New Order
                </Link>
              </div>
              {loadingHosting ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 flex justify-center">
                  <div className="w-6 h-6 border-2 border-gray-200 dark:border-slate-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
                </div>
              ) : hosting.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center">
                  <FaServer size={28} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-slate-500 text-sm mb-4">No hosting orders yet.</p>
                  <Link href="/hosting" className="text-sm font-semibold px-5 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                    Browse Hosting Plans
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {hosting.map(o => <HostingCard key={o._id} order={o} />)}
                </div>
              )}
            </div>
          )}

          {/* Domains tab */}
          {tab === "domains" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900 dark:text-white">All Domains</h2>
                <Link href="/domains" className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                  + Register Domain
                </Link>
              </div>
              {loadingDomains ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 flex justify-center">
                  <div className="w-6 h-6 border-2 border-gray-200 dark:border-slate-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
                </div>
              ) : domains.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center">
                  <FaGlobe size={28} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-gray-400 dark:text-slate-500 text-sm mb-4">No domains registered yet.</p>
                  <Link href="/domains" className="text-sm font-semibold px-5 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                    Search Domains
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {domains.map(o => <DomainCard key={o._id} order={o} />)}
                </div>
              )}
            </div>
          )}
        </div>
        )}

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-gray-50 dark:bg-slate-950 min-h-screen flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-slate-400">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            <p className="text-sm">Loading dashboard…</p>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
