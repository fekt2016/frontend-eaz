"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  FaServer, FaGlobe, FaShieldAlt, FaExternalLinkAlt,
  FaClock, FaChevronRight, FaUserCircle, FaUsers, FaMoneyBillWave,
  FaArrowUp, FaArrowDown, FaExclamationTriangle, FaRedo, FaSpinner,
  FaCalendarAlt, FaTools,
} from "react-icons/fa";
import {
  StatCard, HostingCard, DomainCard, ShopOrderCard, RepairCard,
} from "@/components/dashboard/customer/CustomerCards";
import { formatGhs } from "@/lib/shop";
import { useHostingOrders, useHostingAdminOverview } from "@/hooks/queries/useHosting";
import { useDomainOrders } from "@/hooks/queries/useDomains";
import { useMyRepairs } from "@/hooks/queries/useRepairs";
import { useOrders, useMyOrders, useRecentOrders } from "@/hooks/queries/useOrders";
import { useConsultations } from "@/hooks/queries/useContacts";
import { useSettings, useUpdateSettings } from "@/hooks/queries/useSettings";

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
  pending:  "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
  paid:     "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  active:   "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled:"bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  failed:   "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  completed:"bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const consultationStatusColors = {
  new:      "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
  read:     "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  replied:  "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  archived: "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400",
};

/* ── Admin overview section (shown to admin/superadmin) ────────────────── */

function AdminOverviewSection() {
  const overviewQ = useHostingAdminOverview();
  const consultationsQ = useConsultations();
  const shopOrdersQ = useRecentOrders(5);
  const fetchData = () => { overviewQ.refetch(); consultationsQ.refetch(); shopOrdersQ.refetch(); };

  const d = overviewQ.data ?? null;
  const loading = overviewQ.isLoading || consultationsQ.isLoading || shopOrdersQ.isLoading;
  const shopOrders = shopOrdersQ.data ?? [];
  const allContacts = consultationsQ.data ?? [];
  const consultations = {
    total: allContacts.length,
    new: allContacts.filter((c) => c.status === "new").length,
    recent: allContacts.slice(0, 5),
  };

  // Maintenance settings (React Query) + local editor form state.
  const settingsQ = useSettings();
  const maint = settingsQ.data ?? null;
  const updateSettings = useUpdateSettings();
  const maintSaving = updateSettings.isPending;
  const [maintMsg, setMaintMsg]     = useState("");
  const [maintStart, setMaintStart] = useState("");
  const [maintEnd, setMaintEnd]     = useState("");
  const [maintExpanded, setMaintExpanded] = useState(false);

  useEffect(() => {
    if (!maint) return;
    setMaintMsg(maint.maintenanceMessage || "");
    setMaintStart(maint.maintenanceScheduledStart ? new Date(maint.maintenanceScheduledStart).toISOString().slice(0, 16) : "");
    setMaintEnd(maint.maintenanceScheduledEnd ? new Date(maint.maintenanceScheduledEnd).toISOString().slice(0, 16) : "");
  }, [maint]);

  const toggleMaintenance = () => {
    if (!maint) return;
    updateSettings.mutate({ maintenanceMode: !maint.maintenanceMode });
  };

  const saveMaintSchedule = (e) => {
    e.preventDefault();
    updateSettings.mutate(
      {
        maintenanceMessage:        maintMsg,
        maintenanceScheduledStart: maintStart || null,
        maintenanceScheduledEnd:   maintEnd   || null,
      },
      { onSuccess: () => setMaintExpanded(false) },
    );
  };

  const clearSchedule = () => {
    updateSettings.mutate(
      { maintenanceScheduledStart: null, maintenanceScheduledEnd: null },
      { onSuccess: () => { setMaintStart(""); setMaintEnd(""); } },
    );
  };

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
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-400 text-white">SCHEDULED</span>
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
                  className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-400 transition resize-none"
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
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-brand-400 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 block mb-1">End (auto-deactivate + countdown)</label>
                  <input
                    type="datetime-local"
                    value={maintEnd}
                    onChange={(e) => setMaintEnd(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-brand-400 transition"
                  />
                </div>
              </div>

              {maintStart && !maintEnd && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
                  <FaExclamationTriangle size={12} className="text-brand-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-brand-700 dark:text-brand-400">
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
                  className="text-xs font-bold px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-400 text-white transition disabled:opacity-50 flex items-center gap-1.5"
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
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-brand-300 dark:hover:border-brand-700/50 hover:text-brand-700 dark:hover:text-brand-400 transition">
            {label} →
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400 dark:text-slate-500">
          <FaSpinner className="animate-spin text-2xl text-brand-500" />
          <span className="text-sm">Loading overview…</span>
        </div>
      ) : !d ? (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500 text-sm">Failed to load data. <button onClick={fetchData} className="text-brand-500 underline">Retry</button></div>
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
                <div className="flex items-center gap-2 rounded-xl border border-brand-200 dark:border-brand-900/40 bg-brand-50 dark:bg-brand-900/20 px-4 py-3 text-sm text-brand-900 dark:text-brand-300">
                  <FaExclamationTriangle className="shrink-0 text-brand-500" size={14} />
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
            <KpiCard icon={FaMoneyBillWave} label="Total Revenue" value={fmt(d.revenue?.total)} sub={`Hosting ${fmt(d.revenue?.hosting)} · Domains ${fmt(d.revenue?.domains)}`} accent="bg-brand-500" growth={d.revenue?.growth} />
            <KpiCard icon={FaMoneyBillWave} label="Revenue This Month" value={fmt(d.revenue?.thisMonth)} sub={`Last month: ${fmt(d.revenue?.lastMonth)}`} accent="bg-brand-400" />
            <KpiCard icon={FaServer} label="Active Hosting" value={fmtNum(d.hosting?.active)} sub={`${fmtNum(d.hosting?.total)} total orders`} accent="bg-emerald-500" />
            <KpiCard icon={FaUsers} label="Total Users" value={fmtNum(d.users?.total)} sub={`+${fmtNum(d.users?.thisMonth)} this month`} accent="bg-blue-500" />
            <KpiCard icon={FaGlobe} label="Domain Orders" value={fmtNum(d.domains?.total)} sub={`+${fmtNum(d.domains?.thisMonth)} this month`} accent="bg-violet-500" />
            <KpiCard icon={FaServer} label="Hosting This Month" value={fmtNum(d.hosting?.thisMonth)} sub={`Last month: ${fmtNum(d.hosting?.lastMonth)}`} accent="bg-gray-700" />
            <KpiCard icon={FaServer} label="Pending Orders" value={fmtNum(d.hosting?.pending)} sub="Awaiting payment verification" accent="bg-brand-600" />
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
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-500 text-white">{consultations.new} new</span>
                )}
              </div>
              <Link href="/dashboard/consultations" className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1">
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
                      {c.service && <span className="text-brand-500 font-medium">{c.service} · </span>}
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
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Shop Orders</h3>
                <Link href="/dashboard/commerce/orders" className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1">View all <FaChevronRight size={9} /></Link>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-slate-800">
                {shopOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-slate-500 px-5 py-6 text-center">No shop orders yet</p>
                ) : shopOrders.map((o) => (
                  <Link key={o._id} href={`/dashboard/commerce/orders/${o._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">{o.orderNumber}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        {(o.items || []).reduce((n, i) => n + (i.qty || 0), 0)} items · {fmtDate(o.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{formatGhs(o.total)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[o.status] || "bg-gray-50 text-gray-500"}`}>{o.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-slate-800">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Hosting Orders</h3>
                <Link href="/dashboard/hosting-orders" className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1">View all <FaChevronRight size={9} /></Link>
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
                <Link href="/dashboard/domain-orders" className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1">View all <FaChevronRight size={9} /></Link>
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
  const isAdmin = ["admin", "superadmin"].includes(user?.role);
  // Admin & staff see all shop orders; customers and technicians only see
  // their own. GET /orders is gated to admin/staff on the backend.
  const canSeeAllOrders = ["admin", "superadmin", "staff"].includes(user?.role);

  // Personal overview data — only fetched for non-admins (admins see the
  // AdminOverviewSection above instead).
  const enabled = !isAdmin;
  const hostingQ = useHostingOrders({ enabled });
  const domainsQ = useDomainOrders({ enabled });
  const allOrdersQ = useOrders({ limit: 5 }, { enabled: enabled && canSeeAllOrders });
  const myOrdersQ = useMyOrders({ enabled: enabled && !canSeeAllOrders });
  const repairsQ = useMyRepairs({ enabled });

  const hosting = hostingQ.data ?? [];
  const domains = domainsQ.data ?? [];
  const orders = canSeeAllOrders ? (allOrdersQ.data ?? []) : (myOrdersQ.data ?? []);
  const repairs = repairsQ.data ?? [];
  const loadingHosting = hostingQ.isLoading;
  const loadingDomains = domainsQ.isLoading;
  const loadingOrders = canSeeAllOrders ? allOrdersQ.isLoading : myOrdersQ.isLoading;
  const loadingRepairs = repairsQ.isLoading;

  const activeHosting = hosting.filter(o => o.status === "active").length;
  const activeDomains = domains.filter(o => o.status === "completed").length;
  const pendingOrders = [...hosting, ...domains].filter(o => o.status === "pending").length;

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center">
              <FaUserCircle size={24} className="text-brand-500" />
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
            <StatCard icon={FaServer} label="Active Hosting" value={activeHosting} color="bg-brand-400" />
            <StatCard icon={FaGlobe} label="Active Domains" value={activeDomains} color="bg-blue-500" />
            <StatCard icon={FaClock} label="Pending Orders" value={pendingOrders} color="bg-gray-400" />
          </div>

          {/* Overview */}
          <div className="grid md:grid-cols-2 gap-8">
              {/* Recent Hosting */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Recent Hosting</h2>
                  <Link href="/dashboard/hosting" className="text-xs text-brand-500 hover:underline flex items-center gap-1">
                    View all <FaChevronRight size={9} />
                  </Link>
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
                  <Link href="/dashboard/domains" className="text-xs text-brand-500 hover:underline flex items-center gap-1">
                    View all <FaChevronRight size={9} />
                  </Link>
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

              {/* Recent Orders */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
                  <Link href={canSeeAllOrders ? "/dashboard/commerce/orders" : "/dashboard/orders"} className="text-xs text-brand-500 hover:underline flex items-center gap-1">
                    View all <FaChevronRight size={9} />
                  </Link>
                </div>
                {loadingOrders ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 flex justify-center">
                    <div className="w-5 h-5 border-2 border-gray-200 dark:border-slate-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 text-center">
                    <p className="text-gray-400 dark:text-slate-500 text-sm mb-3">No shop orders yet.</p>
                    <Link href="/shop" className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition">
                      Visit the Shop
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 2).map(o => <ShopOrderCard key={o._id} order={o} />)}
                  </div>
                )}
              </div>

              {/* Recent Repairs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Recent Repairs</h2>
                  <Link href="/dashboard/repairs" className="text-xs text-brand-500 hover:underline flex items-center gap-1">
                    View all <FaChevronRight size={9} />
                  </Link>
                </div>
                {loadingRepairs ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 flex justify-center">
                    <div className="w-5 h-5 border-2 border-gray-200 dark:border-slate-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
                  </div>
                ) : repairs.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 text-center">
                    <p className="text-gray-400 dark:text-slate-500 text-sm">No repairs on file.</p>
                    <p className="text-xs text-gray-300 dark:text-slate-600 mt-1 mb-3">Create one online — bring it in or send a rider.</p>
                    <Link href="/repair" className="inline-block text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition">
                      Create a Repair Job
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {repairs.slice(0, 2).map(j => <RepairCard key={j._id} job={j} />)}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="md:col-span-2">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { href: "/repair",  icon: FaTools, label: "Repair Device", color: "text-cyan-500 bg-cyan-50" },
                    { href: "/hosting", icon: FaServer, label: "Order Hosting", color: "text-brand-500 bg-brand-50" },
                    { href: "/domains", icon: FaGlobe, label: "Register Domain", color: "text-blue-500 bg-blue-50" },
                    { href: "/contact", icon: FaShieldAlt, label: "Get Support", color: "text-emerald-500 bg-emerald-50" },
                    { href: "/dashboard/hosting", icon: FaExternalLinkAlt, label: "cPanel (my orders)", color: "text-purple-500 bg-purple-50" },
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
