"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Server, Globe, Clock, ChevronRight, CircleUser,
  Wrench, CheckCircle2, TriangleAlert, Boxes, ShoppingBag,
} from "lucide-react";
import {
  Alert, Badge, Button, Card, EmptyState, Input, PageHeader,
  Skeleton, SkeletonText, Switch, Textarea,
} from "@/components/ui";
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

/*
 * Status pills use the semantic tones (see components/ui/Badge.jsx) instead of
 * per-status rainbow chips: paid/processing/shipped are all "in flight" and
 * share info, delivered succeeds, cancelled goes quiet, pending reads brand.
 */
const ORDER_STATUS_TONES = {
  pending:    "brand",
  paid:       "info",
  processing: "info",
  shipped:    "info",
  delivered:  "success",
  cancelled:  "neutral",
};

function fmtShortDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GH", { day: "numeric", month: "short" });
}

// Recent shop orders + online repair-part orders — so staff see commerce
// activity, not just repair jobs, on their dashboard.
export function RecentOrdersList({ shopOrders, partOrders, loading }) {
  const isEmpty = !loading && shopOrders.length === 0 && partOrders.length === 0;
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
        <Link href="/dashboard/pos/orders" className="text-xs text-brand-ink dark:text-brand-400 hover:underline">View all →</Link>
      </div>
      {loading ? (
        <div className="p-5 space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : isEmpty ? (
        <EmptyState title="No orders yet." />
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-slate-800">
          {shopOrders.map(o => (
            <Link
              key={o._id}
              href={`/dashboard/commerce/orders/${o._id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={11} aria-hidden="true" className="text-brand-ink dark:text-brand-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate font-mono">{o.orderNumber}</p>
                  <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
                    Shop · {(o.items || []).reduce((n, i) => n + (i.qty || 0), 0)} item(s) · {fmtShortDate(o.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{formatGhs(o.total)}</span>
                <Badge tone={ORDER_STATUS_TONES[o.status] || "neutral"} className="capitalize">{o.status}</Badge>
              </div>
            </Link>
          ))}
          {partOrders.map(o => (
            <Link
              key={o._id}
              href="/dashboard/pos/orders"
              className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                  <Boxes size={11} aria-hidden="true" className="text-brand-ink dark:text-brand-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{o.partName || "Part order"}</p>
                  <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
                    Repair part · {o.job?.jobNumber || "—"} · {fmtShortDate(o.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <Badge tone={ORDER_STATUS_TONES[o.status] || "neutral"} className="capitalize">{o.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

const JOB_STATUS_TONES = {
  received:   "info",
  diagnosing: "info",
  repairing:  "brand",
  ready:      "success",
  collected:  "neutral",
  cancelled:  "neutral",
};

const JOB_STATUS_LABEL = {
  received: "Received", diagnosing: "Diagnosing", repairing: "Repairing",
  ready: "Ready", collected: "Collected", cancelled: "Cancelled",
};

/* Icon colours come straight from PosOverview's measured STAT_TONES set:
 * every value clears WCAG AA on paper, white, ink and slate-900 alike. */
const POS_ICON_TONES = {
  brand:   "text-brand-ink dark:text-brand-400",
  success: "text-success dark:text-success-dark",
  error:   "text-error dark:text-error-dark",
  info:    "text-info dark:text-info-dark",
  muted:   "text-gray-500 dark:text-slate-400",
};

function PosStatCard({ label, value, icon: Icon, tone = "brand", sub }) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <p className="font-mono text-eyebrow font-bold uppercase text-gray-600 dark:text-slate-400">{label}</p>
        <Icon size={14} aria-hidden="true" className={POS_ICON_TONES[tone] || POS_ICON_TONES.brand} />
      </div>
      <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white mb-0.5">{value ?? "—"}</p>
      {sub && <p className="text-xs text-gray-600 dark:text-slate-400">{sub}</p>}
    </Card>
  );
}

// Shared recent-jobs list — each row links to the job so it can be updated.
export function RecentJobsList({ jobs, loading }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Jobs</h2>
        <Link href="/dashboard/pos/jobs" className="text-xs text-brand-ink dark:text-brand-400 hover:underline">View all →</Link>
      </div>
      {loading ? (
        <div className="p-5 space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <EmptyState icon={Wrench} title="No jobs yet." />
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-slate-800">
          {jobs.map(job => (
            <Link
              key={job._id}
              href={`/dashboard/pos/jobs/${job._id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                  <Wrench size={11} aria-hidden="true" className="text-brand-ink dark:text-brand-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{job.jobNumber}</p>
                  <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
                    {job.customer?.name} · {job.deviceBrand} {job.deviceModel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                {job.priority === "urgent" && (
                  <TriangleAlert size={11} aria-hidden="true" className="text-error dark:text-error-dark" />
                )}
                <Badge tone={JOB_STATUS_TONES[job.status] || "neutral"} className="capitalize">
                  {JOB_STATUS_LABEL[job.status] || job.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
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

  const stats = data?.stats;

  if (error) {
    return (
      <div className="p-5">
        <Alert tone="error">{error.message || "Failed to load dashboard."}</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="My Dashboard"
        description={`${isTech ? "Jobs assigned to you" : "Your jobs & sales"} · ${
          new Date().toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
        }`}
      />

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(isTech ? 4 : 8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PosStatCard label={isTech ? "My Jobs" : "Jobs I Created"} value={stats?.myTotalJobs} icon={Wrench} tone="info" sub="All time" />
          <PosStatCard label="Pending" value={stats?.myPendingJobs} icon={Clock} tone="brand" sub="In progress" />
          <PosStatCard label="Ready" value={stats?.myReadyJobs} icon={CheckCircle2} tone="success" sub="Waiting for collection" />
          <PosStatCard label="Completed" value={stats?.myCompletedJobs} icon={CheckCircle2} tone="muted" sub="Collected" />

          {isTech ? (
            <PosStatCard label="Assigned Today" value={stats?.myTodayJobs} icon={Wrench} tone="brand" sub="New today" />
          ) : (
            <>
              <PosStatCard label="My Sales" value={stats?.mySalesCount} icon={ShoppingBag} tone="info" sub="Products sold (all time)" />
              <PosStatCard label="Sales Revenue" value={formatGhs(stats?.mySalesRevenue || 0)} icon={CheckCircle2} tone="success" sub="From my sales" />
              <PosStatCard label="Today's Sales" value={formatGhs(stats?.myTodaySalesRevenue || 0)} icon={CheckCircle2} tone="success" sub={`${stats?.myTodaySalesCount || 0} sale(s) today`} />
              <PosStatCard
                label="Low Stock"
                value={stats?.lowStockCount}
                icon={Boxes}
                tone={stats?.lowStockCount > 0 ? "error" : "muted"}
                sub="Parts below threshold"
              />
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

  if (error) {
    return (
      <div className="p-5">
        <Alert tone="error">{error.message || "Failed to load dashboard."}</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Dashboard"
        description={new Date().toLocaleDateString("en-GH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      />

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
    /* A plain div rather than Card: the active state tints the whole surface,
     * which Card's fixed white/slate fill would fight. */
    <div className={`rounded-2xl border overflow-hidden ${
      maint.maintenanceActive
        ? "border-error/30 bg-error-surface dark:border-error-dark/30 dark:bg-error-surface-dark"
        : "border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    }`}>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            maint.maintenanceActive
              ? "bg-error text-white dark:bg-error-dark dark:text-gray-900"
              : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
          }`}>
            <Wrench size={14} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Maintenance Mode
              {maint.maintenanceActive && (
                <Badge tone="error">Active</Badge>
              )}
              {maint.maintenanceScheduledStart && !maint.maintenanceActive && (
                <Badge tone="brand">Scheduled</Badge>
              )}
            </p>
            <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
              {maint.maintenanceActive
                ? "Site is in maintenance — visitors see the maintenance page"
                : "Site is live — toggle to put it in maintenance mode"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setMaintExpanded((v) => !v)}>
            {maintExpanded ? "Hide settings ↑" : "Schedule / message ↓"}
          </Button>
          <Switch
            checked={!!maint.maintenanceMode}
            onChange={toggleMaintenance}
            disabled={maintSaving}
            aria-label="Maintenance mode"
          />
        </div>
      </div>

      {maintExpanded && (
        <form onSubmit={saveMaintSchedule} className="px-5 pb-5 border-t border-gray-100 dark:border-slate-800 pt-4 space-y-4">
          <Textarea
            label="Maintenance message (shown to visitors)"
            value={maintMsg}
            onChange={(e) => setMaintMsg(e.target.value)}
            rows={2}
            className="resize-none"
            placeholder="We're performing scheduled maintenance. We'll be back shortly!"
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="Start (auto-activate)"
              type="datetime-local"
              value={maintStart}
              onChange={(e) => setMaintStart(e.target.value)}
            />
            <Input
              label="End (auto-deactivate + countdown)"
              type="datetime-local"
              value={maintEnd}
              onChange={(e) => setMaintEnd(e.target.value)}
            />
          </div>

          {maintStart && !maintEnd && (
            <Alert tone="warning">
              <strong>No end time set.</strong> Once the start time passes, maintenance will stay active indefinitely until you turn it off manually.
            </Alert>
          )}

          <div className="flex items-center gap-2 justify-end">
            {(maint.maintenanceScheduledStart || maint.maintenanceScheduledEnd) && (
              <Button variant="secondary" size="sm" onClick={clearSchedule} disabled={maintSaving}>
                Clear schedule
              </Button>
            )}
            <Button type="submit" size="sm" loading={maintSaving}>
              Save settings
            </Button>
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
            <CircleUser size={24} aria-hidden="true" className="text-brand-ink dark:text-brand-400" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
              {user?.name ? `Hey, ${user.name.split(" ")[0]} 👋` : "Dashboard"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Server} label="Active Hosting" value={activeHosting} color="bg-brand-400" />
        <StatCard icon={Globe} label="Active Domains" value={activeDomains} color="bg-info" />
        <StatCard icon={Clock} label="Pending Orders" value={pendingOrders} color="bg-gray-400" />
      </div>

      {/* Overview */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Hosting */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Hosting</h2>
            <Link href="/dashboard/hosting" className="text-xs font-semibold text-brand-ink dark:text-brand-400 hover:underline flex items-center gap-1">
              View all <ChevronRight size={9} aria-hidden="true" />
            </Link>
          </div>
          {loadingHosting ? (
            <Card padding="md"><SkeletonText lines={3} /></Card>
          ) : hosting.length === 0 ? (
            <Card padding="md" className="text-center">
              <EmptyState
                title="No hosting orders yet."
                description="Pick a plan and your site can be live today."
                action={<Button href="/hosting" size="sm">Browse Plans</Button>}
              />
            </Card>
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
            <Link href="/dashboard/domains" className="text-xs font-semibold text-brand-ink dark:text-brand-400 hover:underline flex items-center gap-1">
              View all <ChevronRight size={9} aria-hidden="true" />
            </Link>
          </div>
          {loadingDomains ? (
            <Card padding="md"><SkeletonText lines={3} /></Card>
          ) : domains.length === 0 ? (
            <Card padding="md" className="text-center">
              <EmptyState
                title="No domains registered yet."
                description="Search for a name and register it in minutes."
                action={<Button href="/domains" size="sm">Search Domains</Button>}
              />
            </Card>
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
            <Link href="/dashboard/orders" className="text-xs font-semibold text-brand-ink dark:text-brand-400 hover:underline flex items-center gap-1">
              View all <ChevronRight size={9} aria-hidden="true" />
            </Link>
          </div>
          {loadingOrders ? (
            <Card padding="md"><SkeletonText lines={3} /></Card>
          ) : orders.length === 0 ? (
            <Card padding="md" className="text-center">
              <EmptyState
                title="No shop orders yet."
                description="Browse the shop — checkout takes under a minute."
                action={<Button href="/shop" size="sm">Visit the Shop</Button>}
              />
            </Card>
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
            <Link href="/dashboard/repairs" className="text-xs font-semibold text-brand-ink dark:text-brand-400 hover:underline flex items-center gap-1">
              View all <ChevronRight size={9} aria-hidden="true" />
            </Link>
          </div>
          {loadingRepairs ? (
            <Card padding="md"><SkeletonText lines={3} /></Card>
          ) : repairs.length === 0 ? (
            <Card padding="md" className="text-center">
              <EmptyState
                title="No repairs on file."
                description="Create one online — bring it in or send a rider."
                action={<Button href="/repair" size="sm">Create a Repair Job</Button>}
              />
            </Card>
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
