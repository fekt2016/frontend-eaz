"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Server, Globe, Clock, ChevronRight, CircleUser,
  Wrench, CheckCircle2, TriangleAlert, Plus, Boxes, ShoppingBag,
  Loader2,
} from "lucide-react";
import {
  StatCard, HostingCard, DomainCard, ShopOrderCard, RepairCard,
} from "@/components/dashboard/customer/CustomerCards";
import { formatGhs } from "@/lib/shop";
import { useHostingOrders } from "@/hooks/queries/useHosting";
import { useDomainOrders } from "@/hooks/queries/useDomains";
import { useMyRepairs } from "@/hooks/queries/useRepairs";
import { useMyOrders, useRecentOrders } from "@/hooks/queries/useOrders";
import { useSettings, useUpdateSettings } from "@/hooks/queries/useSettings";
import { useMyOverview, useOverview, usePartOrders } from "@/hooks/queries/usePosDashboard";
import PosOverview from "@/components/pos/PosOverview";

const ORDER_STATUS_COLORS = {
  pending:    "bg-brand-500/15 text-brand-600 dark:text-brand-400",
  paid:       "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  processing: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  shipped:    "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  delivered:  "bg-green-500/15 text-green-600 dark:text-green-400",
  cancelled:  "bg-red-500/15 text-red-600 dark:text-red-400",
};

function fmtShortDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GH", { day: "numeric", month: "short" });
}

// Recent shop orders + online repair-part orders — so staff see commerce
// activity, not just repair jobs, on their dashboard.
function RecentOrdersList({ shopOrders, partOrders, loading }) {
  const isEmpty = !loading && shopOrders.length === 0 && partOrders.length === 0;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
        <Link href="/dashboard/pos/orders" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">View all →</Link>
      </div>
      {loading ? (
        <div className="p-5 space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        </div>
      ) : isEmpty ? (
        <div className="p-8 text-center text-gray-500 text-sm">No orders yet.</div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {shopOrders.map(o => (
            <Link
              key={o._id}
              href={`/dashboard/commerce/orders/${o._id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={11} className="text-brand-600 dark:text-brand-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate font-mono">{o.orderNumber}</p>
                  <p className="text-xs text-gray-500 truncate">
                    Shop · {(o.items || []).reduce((n, i) => n + (i.qty || 0), 0)} item(s) · {fmtShortDate(o.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{formatGhs(o.total)}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${ORDER_STATUS_COLORS[o.status] || "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                  {o.status}
                </span>
              </div>
            </Link>
          ))}
          {partOrders.map(o => (
            <Link
              key={o._id}
              href="/dashboard/pos/orders"
              className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                  <Boxes size={11} className="text-brand-600 dark:text-brand-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{o.partName || "Part order"}</p>
                  <p className="text-xs text-gray-500 truncate">
                    Repair part · {o.job?.jobNumber || "—"} · {fmtShortDate(o.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${ORDER_STATUS_COLORS[o.status] || "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                  {o.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_COLORS = {
  received:   "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  diagnosing: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  repairing:  "bg-brand-500/15 text-brand-600 dark:text-brand-400",
  ready:      "bg-green-500/15 text-green-600 dark:text-green-400",
  collected:  "bg-gray-500/15 text-gray-500 dark:text-gray-400",
  cancelled:  "bg-red-500/15 text-red-600 dark:text-red-400",
};

const STATUS_LABEL = {
  received: "Received", diagnosing: "Diagnosing", repairing: "Repairing",
  ready: "Ready", collected: "Collected", cancelled: "Cancelled",
};

function PosStatCard({ label, value, icon: Icon, color = "text-brand-600 dark:text-brand-400", sub }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <Icon size={14} className={color} />
      </div>
      <p className={`text-3xl font-bold text-gray-900 dark:text-white mb-0.5`}>{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

// Shared recent-jobs list — each row links to the job so it can be updated.
function RecentJobsList({ jobs, loading }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Jobs</h2>
        <Link href="/dashboard/pos/jobs" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">View all →</Link>
      </div>
      {loading ? (
        <div className="p-5 space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">No jobs yet. <Link href="/dashboard/pos/jobs/new" className="text-brand-600 dark:text-brand-400 hover:underline">Create first job →</Link></div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {jobs.map(job => (
            <Link
              key={job._id}
              href={`/dashboard/pos/jobs/${job._id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                  <Wrench size={11} className="text-brand-600 dark:text-brand-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{job.jobNumber}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {job.customer?.name} · {job.deviceBrand} {job.deviceModel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                {job.priority === "urgent" && (
                  <TriangleAlert size={11} className="text-red-600 dark:text-red-400" />
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[job.status] || "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                  {STATUS_LABEL[job.status] || job.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Personal dashboard for staff & technicians (scoped to the logged-in user) ──
function MyDashboard({ user }) {
  const isTech = user.role === "technician";

  const { data, isLoading: loading, error } = useMyOverview();

  // Staff (not technicians) also see recent commerce activity. These endpoints
  // are gated to admin/staff on the backend, so technicians never call them.
  const recentOrdersQ = useRecentOrders(5, { enabled: !isTech });
  const partOrdersQ   = usePartOrders("all", { enabled: !isTech });
  const shopOrders    = recentOrdersQ.data ?? [];
  const partOrders    = (partOrdersQ.data ?? []).slice(0, 5);
  const ordersLoading = !isTech && (recentOrdersQ.isLoading || partOrdersQ.isLoading);

  const stats  = data?.stats;

  if (error) return <p className="text-red-600 dark:text-red-400 text-sm p-5">{error.message || "Failed to load dashboard."}</p>;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isTech ? "Jobs assigned to you" : "Your jobs & sales"} ·{" "}
            {new Date().toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link
          href="/dashboard/pos/jobs/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition"
        >
          <Plus size={11} /> New Job
        </Link>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(isTech ? 4 : 8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PosStatCard label={isTech ? "My Jobs" : "Jobs I Created"} value={stats?.myTotalJobs}     icon={Wrench}      color="text-blue-600 dark:text-blue-400" sub="All time" />
          <PosStatCard label="Pending"                                value={stats?.myPendingJobs}   icon={Clock}       color="text-brand-600 dark:text-brand-400" sub="In progress" />
          <PosStatCard label="Ready"                                  value={stats?.myReadyJobs}     icon={CheckCircle2} color="text-green-600 dark:text-green-400" sub="Waiting for collection" />
          <PosStatCard label="Completed"                              value={stats?.myCompletedJobs} icon={CheckCircle2} sub="Collected" />

          {isTech ? (
            <PosStatCard label="Assigned Today" value={stats?.myTodayJobs} icon={Wrench} sub="New today" />
          ) : (
            <>
<PosStatCard label="My Sales"      value={stats?.mySalesCount}                                     icon={ShoppingBag} color="text-purple-600 dark:text-purple-400" sub="Products sold (all time)" />
              <PosStatCard label="Sales Revenue" value={`GH₵${((stats?.mySalesRevenue || 0) / 100).toLocaleString()}`}   icon={CheckCircle2} color="text-green-600 dark:text-green-400" sub="From my sales" />
              <PosStatCard label="Today's Sales" value={`GH₵${((stats?.myTodaySalesRevenue || 0) / 100).toLocaleString()}`} icon={CheckCircle2} color="text-green-600 dark:text-green-400" sub={`${stats?.myTodaySalesCount || 0} sale(s) today`} />
              <PosStatCard label="Low Stock"     value={stats?.lowStockCount}                                    icon={Boxes}       color={stats?.lowStockCount > 0 ? "text-red-600 dark:text-red-400" : "text-gray-500"} sub="Parts below threshold" />
            </>
          )}
        </div>
      )}

      {/* Recent jobs — tap to update */}
      <RecentJobsList jobs={data?.recentJobs} loading={loading} />

      {/* Recent orders — staff only (technicians aren't authorized for orders) */}
      {!isTech && (
        <RecentOrdersList shopOrders={shopOrders} partOrders={partOrders} loading={ordersLoading} />
      )}
    </div>
  );
}

// ─── Full shop-wide dashboard for admin & superadmin ───────────────────────────
function FullDashboard() {
  const { data, isLoading: loading, error } = useOverview();

  if (error) return <p className="text-red-600 dark:text-red-400 text-sm p-5">{error.message || "Failed to load dashboard."}</p>;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link
          href="/dashboard/pos/jobs/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition"
        >
          <Plus size={11} /> New Job
        </Link>
      </div>

      {/* Full shop-wide overview — same blocks as the Reports page */}
      <PosOverview data={data} loading={loading} />
    </div>
  );
}

// ─── Maintenance mode toggle (admin/superadmin only) ──────────────────────────
function MaintenanceCard() {
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

  if (!maint) return null;

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      maint.maintenanceActive
        ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
        : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900"
    }`}>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            maint.maintenanceActive ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700"
          }`}>
            <Wrench size={14} className={maint.maintenanceActive ? "text-white" : "text-gray-500 dark:text-slate-400"} />
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
              className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-400 transition resize-none"
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
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-brand-400 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 block mb-1">End (auto-deactivate + countdown)</label>
              <input
                type="datetime-local"
                value={maintEnd}
                onChange={(e) => setMaintEnd(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-brand-400 transition"
              />
            </div>
          </div>

          {maintStart && !maintEnd && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
              <TriangleAlert size={12} className="text-brand-500 mt-0.5 flex-shrink-0" />
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
              {maintSaving ? <Loader2 size={10} className="animate-spin" /> : null}
              Save settings
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Customer / personal overview (regular users) ─────────────────────────────
function CustomerOverview() {
  const { user } = useAuth();

  const hostingQ = useHostingOrders();
  const domainsQ = useDomainOrders();
  const myOrdersQ = useMyOrders();
  const repairsQ = useMyRepairs();

  const hosting = hostingQ.data ?? [];
  const domains = domainsQ.data ?? [];
  const orders = myOrdersQ.data ?? [];
  const repairs = repairsQ.data ?? [];
  const loadingHosting = hostingQ.isLoading;
  const loadingDomains = domainsQ.isLoading;
  const loadingOrders = myOrdersQ.isLoading;
  const loadingRepairs = repairsQ.isLoading;

  const activeHosting = hosting.filter(o => o.status === "active").length;
  const activeDomains = domains.filter(o => o.status === "completed").length;
  const pendingOrders = [...hosting, ...domains].filter(o => o.status === "pending").length;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center">
            <CircleUser size={24} className="text-brand-500" />
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
            <CircleUser size={12} /> Settings
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Server} label="Active Hosting" value={activeHosting} color="bg-brand-400" />
        <StatCard icon={Globe} label="Active Domains" value={activeDomains} color="bg-blue-500" />
        <StatCard icon={Clock} label="Pending Orders" value={pendingOrders} color="bg-gray-400" />
      </div>

      {/* Overview */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Hosting */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Hosting</h2>
            <Link href="/dashboard/hosting" className="text-xs text-brand-500 hover:underline flex items-center gap-1">
              View all <ChevronRight size={9} />
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
              View all <ChevronRight size={9} />
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
            <Link href="/dashboard/orders" className="text-xs text-brand-500 hover:underline flex items-center gap-1">
              View all <ChevronRight size={9} />
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
              View all <ChevronRight size={9} />
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
      </div>
    </div>
  );
}

/* ── Dashboard (combined) ──────────────────────────────────────────────── */

function DashboardContent() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === "staff" || role === "technician") {
    return (
      <div className="p-5 lg:p-7">
        <MyDashboard user={user} />
      </div>
    );
  }

  if (role === "admin" || role === "superadmin") {
    return (
      <div className="p-5 lg:p-7 space-y-7">
        <MaintenanceCard />
        <FullDashboard />
      </div>
    );
  }

  return <CustomerOverview />;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-paper dark:bg-ink min-h-screen flex items-center justify-center px-4">
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
