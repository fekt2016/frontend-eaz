"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatGhs } from "@/lib/shop";
import { useAuth } from "@/context/AuthContext";
import {
  FaWrench, FaUsers, FaClock, FaCheckCircle,
  FaExclamationTriangle, FaPlus, FaBoxes, FaBell, FaSpinner, FaShoppingBag,
} from "react-icons/fa";

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
                  <FaShoppingBag size={11} className="text-brand-600 dark:text-brand-400" />
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
                  <FaBoxes size={11} className="text-brand-600 dark:text-brand-400" />
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

function StatCard({ label, value, icon: Icon, color = "text-brand-600 dark:text-brand-400", sub }) {
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
                  <FaWrench size={11} className="text-brand-600 dark:text-brand-400" />
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
                  <FaExclamationTriangle size={11} className="text-red-600 dark:text-red-400" />
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
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [shopOrders, setShopOrders]   = useState([]);
  const [partOrders, setPartOrders]   = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const isTech = user.role === "technician";

  useEffect(() => {
    api.get("/pos/my-overview")
      .then(r => setData(r.data))
      .catch(e => setError(e.message || "Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  // Staff (not technicians) also see recent commerce activity. These endpoints
  // are gated to admin/staff on the backend, so technicians never call them.
  useEffect(() => {
    if (isTech) { setOrdersLoading(false); return; }
    Promise.all([
      api.get("/orders?limit=5").then(r => r.data || []).catch(() => []),
      api.get("/pos/part-orders").then(r => (r.data || []).slice(0, 5)).catch(() => []),
    ])
      .then(([shop, parts]) => { setShopOrders(shop); setPartOrders(parts); })
      .finally(() => setOrdersLoading(false));
  }, [isTech]);

  const stats  = data?.stats;

  if (error) return <p className="text-red-600 dark:text-red-400 text-sm p-5">{error}</p>;

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
          <FaPlus size={11} /> New Job
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
          <StatCard label={isTech ? "My Jobs" : "Jobs I Created"} value={stats?.myTotalJobs}     icon={FaWrench}      color="text-blue-600 dark:text-blue-400" sub="All time" />
          <StatCard label="Pending"                                value={stats?.myPendingJobs}   icon={FaClock}       color="text-brand-600 dark:text-brand-400" sub="In progress" />
          <StatCard label="Ready"                                  value={stats?.myReadyJobs}     icon={FaCheckCircle} color="text-green-600 dark:text-green-400" sub="Waiting for collection" />
          <StatCard label="Completed"                              value={stats?.myCompletedJobs} icon={FaCheckCircle} sub="Collected" />

          {isTech ? (
            <StatCard label="Assigned Today" value={stats?.myTodayJobs} icon={FaWrench} sub="New today" />
          ) : (
            <>
              <StatCard label="My Sales"      value={stats?.mySalesCount}                                     icon={FaShoppingBag} color="text-purple-600 dark:text-purple-400" sub="Products sold (all time)" />
              <StatCard label="Sales Revenue" value={`GH₵${((stats?.mySalesRevenue || 0) / 100).toLocaleString()}`}   icon={FaCheckCircle} color="text-green-600 dark:text-green-400" sub="From my sales" />
              <StatCard label="Today's Sales" value={`GH₵${((stats?.myTodaySalesRevenue || 0) / 100).toLocaleString()}`} icon={FaCheckCircle} color="text-green-600 dark:text-green-400" sub={`${stats?.myTodaySalesCount || 0} sale(s) today`} />
              <StatCard label="Low Stock"     value={stats?.lowStockCount}                                    icon={FaBoxes}       color={stats?.lowStockCount > 0 ? "text-red-600 dark:text-red-400" : "text-gray-500"} sub="Parts below threshold" />
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

  if (error) return <p className="text-red-600 dark:text-red-400 text-sm p-5">{error}</p>;

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
          <FaPlus size={11} /> New Job
        </Link>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today's Revenue"  value={`GH₵${((stats?.todayRevenue || 0) / 100).toLocaleString()}`}  icon={FaCheckCircle} color="text-green-600 dark:text-green-400" sub="Payments received today" />
          <StatCard label="Total Revenue"    value={`GH₵${((stats?.totalRevenue  || 0) / 100).toLocaleString()}`}  icon={FaCheckCircle} color="text-green-600 dark:text-green-400" sub="All time" />
          <StatCard label="Jobs Today"       value={stats?.todayJobs}      icon={FaWrench}           sub="New intake today" />
          <StatCard label="Total Jobs"       value={stats?.totalJobs}      icon={FaWrench}           color="text-blue-600 dark:text-blue-400" sub="All time" />
          <StatCard label="Pending"          value={stats?.pendingJobs}    icon={FaClock}            color="text-brand-600 dark:text-brand-400" sub="In progress" />
          <StatCard label="Ready"            value={stats?.readyJobs}      icon={FaCheckCircle}      color="text-green-600 dark:text-green-400" sub="Waiting for collection" />
          <StatCard label="Customers"        value={stats?.totalCustomers} icon={FaUsers}            color="text-purple-600 dark:text-purple-400" sub="All time" />
          <StatCard label="Low Stock"        value={stats?.lowStockCount}  icon={FaBoxes}            color={stats?.lowStockCount > 0 ? "text-red-600 dark:text-red-400" : "text-gray-500"} sub="Parts below threshold" />
        </div>
      )}

      {/* Revenue chart (simple bars) */}
      {data?.dailyRevenue?.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Last 7 Days Revenue</h2>
          <div className="flex items-end gap-2 h-28">
            {(() => {
              const max = Math.max(...data.dailyRevenue.map(d => d.total), 1);
              return data.dailyRevenue.map(day => (
                <div key={day._id} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-md bg-brand-500/70 hover:bg-brand-500 transition"
                    style={{ height: `${(day.total / max) * 100}%`, minHeight: 4 }}
                    title={`GH₵${(day.total / 100).toLocaleString()}`}
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-brand-500/30 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-500/20 bg-brand-500/5">
            <div className="flex items-center gap-2">
              <FaBell size={13} className="text-brand-600 dark:text-brand-400" />
              <h2 className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                {uncollected.length} Uncollected Device{uncollected.length !== 1 ? "s" : ""}
              </h2>
              <span className="text-xs text-gray-500">ready 3+ days ago</span>
            </div>
            {["superadmin", "admin"].includes(user?.role) && (
              <button
                onClick={handleTriggerReminders}
                disabled={triggering}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium transition disabled:opacity-50"
              >
                {triggering ? <FaSpinner className="animate-spin" size={10} /> : <FaBell size={10} />}
                Send Reminders
              </button>
            )}
          </div>
          {triggerMsg && <p className="text-xs text-green-600 dark:text-green-400 px-5 py-2">{triggerMsg}</p>}
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {uncollected.map(job => (
              <Link
                key={job._id}
                href={`/dashboard/pos/jobs/${job._id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-100/40 dark:hover:bg-gray-800/40 transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-mono font-semibold text-brand-600 dark:text-brand-400">{job.jobNumber}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {job.customer?.name} · {[job.deviceBrand, job.deviceModel].filter(Boolean).join(" ") || "—"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">{job.daysWaiting}d waiting</p>
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
      <RecentJobsList jobs={data?.recentJobs} loading={loading} />
    </div>
  );
}

export default function PosDashboardPage() {
  const { user } = useAuth();
  // Staff & technicians get a personal, scoped dashboard; admins get the full one.
  if (user && ["staff", "technician"].includes(user.role)) {
    return <MyDashboard user={user} />;
  }
  return <FullDashboard />;
}
