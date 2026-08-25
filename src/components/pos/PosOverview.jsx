import Link from "next/link";
import { formatGhs } from "@/lib/shop";
import { statusBadgeProps, statusLabel } from "@/lib/jobStatus";
import { Badge, Card, Skeleton } from "@/components/ui";
import {
  Banknote, Wrench, Users, TriangleAlert,
  CheckCircle2, Loader2, Receipt, Scale, ChartColumn,
  CreditCard, SmartphoneNfc,
} from "lucide-react";

const METHOD_ICONS = {
  cash: Banknote,
  momo: SmartphoneNfc,
  card: CreditCard,
};

/*
 * Tones, not raw colour strings. The old tiles used text-green-600 on white
 * (3.4:1) and text-gray-600 labels (4.0:1); both are below AA. These are the
 * measured semantic tokens.
 */
const STAT_TONES = {
  default: "text-gray-900 dark:text-white",
  success: "text-success dark:text-success-dark",
  error:   "text-error dark:text-error-dark",
  brand:   "text-brand-ink dark:text-brand-400",
  info:    "text-info dark:text-info-dark",
};

function Stat({ label, value, sub, tone = "default", icon: Icon }) {
  const cls = STAT_TONES[tone] || STAT_TONES.default;
  return (
    <Card>
      <div className="mb-2 flex items-start justify-between">
        <p className="font-mono text-eyebrow font-bold uppercase text-gray-600 dark:text-slate-400">{label}</p>
        {Icon && <Icon size={15} aria-hidden="true" className={`${cls} opacity-70`} />}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${cls}`}>{value ?? "—"}</p>
      {sub && <p className="mt-1 text-caption text-gray-600 dark:text-slate-400">{sub}</p>}
    </Card>
  );
}

/**
 * Shop-wide POS overview — shared by the Reports page and the POS dashboard.
 * Renders every block from GET /pos/overview. `data` is the response payload.
 */
export default function PosOverview({ data, loading }) {
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

  if (loading && !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
<Stat label="Total Revenue"     value={formatGhs(stats?.totalRevenue || 0)}  tone="success"  icon={Banknote} sub={`${stats?.totalPayments || 0} payments`} />
        <Stat label="Today's Revenue"   value={formatGhs(stats?.todayRevenue || 0)} tone="brand"  icon={ChartColumn}      sub="Payments today" />
        <Stat label="Total Jobs"        value={stats?.totalJobs}        icon={Wrench}    sub="All time" />
        <Stat label="New Today"         value={stats?.todayJobs}        icon={Wrench}    sub="Jobs created today" tone="info" />
        <Stat label="In Progress"       value={stats?.pendingJobs}      icon={Loader2}   tone="brand" sub="Active repairs" />
        <Stat label="Ready to Collect"  value={stats?.readyJobs}        icon={CheckCircle2} tone="success" sub="Awaiting pickup" />
        <Stat label="Customers"         value={stats?.totalCustomers}   icon={Users}     sub="Registered" />
        <Stat label="Low Stock"         value={stats?.lowStockCount}    icon={TriangleAlert} tone={stats?.lowStockCount > 0 ? "error" : "success"} sub="Parts below threshold" />
        <Stat label="Total Expenses"    value={formatGhs(stats?.totalExpenses || 0)} tone="error" icon={Receipt} sub="Running costs" />
        <Stat
          label="Net Profit"
          value={formatGhs(stats?.netProfit || 0)}
          tone={(stats?.netProfit || 0) >= 0 ? "success" : "error"}
          icon={Scale}
          sub="Revenue minus expenses"
        />
      </div>

      {/* Revenue chart */}
      {daily.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">Daily Revenue</h2>
          <div className="flex items-end gap-1.5 h-40 overflow-x-auto pb-1">
            {daily.map(day => (
              <div key={day._id} className="flex-1 min-w-[28px] flex flex-col items-center gap-1.5">
                <p className="whitespace-nowrap text-caption text-gray-600 dark:text-slate-400">
                  GH₵{day.total >= 100000 ? `${(day.total/100000).toFixed(1)}k` : (day.total/100).toLocaleString()}
                </p>
                <div
                  className="w-full rounded-t-lg bg-brand-500/70 hover:bg-brand-500 transition"
                  title={`${formatGhs(day.total)} · ${day.count} payment${day.count !== 1 ? "s" : ""}`}
                  style={{ height: `${Math.max(4, (day.total / maxDailyRevenue) * 100)}%` }}
                />
                <span className="whitespace-nowrap text-caption text-gray-600 dark:text-slate-400">
                  {new Date(day._id + "T00:00:00").toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses breakdown */}
      {expenseCats.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Expenses by Category</h2>
            <Link href="/dashboard/pos/expenses" className="text-xs text-brand-ink dark:text-brand-400 hover:underline">Manage →</Link>
          </div>
          <div className="space-y-3">
            {expenseCats.map(e => {
              const totalExp = expenseCats.reduce((s, x) => s + x.total, 0);
              const pct = totalExp > 0 ? Math.round((e.total / totalExp) * 100) : 0;
              return (
                <div key={e._id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-slate-300 capitalize">{e._id}</span>
                    <span className="text-gray-600 dark:text-slate-400">{formatGhs(e.total)} · {pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-red-400/60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800 flex justify-between text-sm">
            <span className="text-gray-600 dark:text-slate-400">Total Expenses</span>
            <span className="text-error dark:text-error-dark font-semibold">{formatGhs(stats?.totalExpenses || 0)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600 dark:text-slate-400">Net Profit</span>
            <span className={`font-bold ${(stats?.netProfit || 0) >= 0 ? "text-success dark:text-success-dark" : "text-error dark:text-error-dark"}`}>
              {formatGhs(stats?.netProfit || 0)}
            </span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Payment methods */}
        {methods.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Payment Methods</h2>
            <div className="space-y-3">
              {methods.map(m => {
                const total = methods.reduce((s, x) => s + x.total, 0);
                const pct   = total > 0 ? Math.round((m.total / total) * 100) : 0;
                return (
                  <div key={m._id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-slate-300 capitalize flex items-center gap-1.5">
                        {(() => { const M = METHOD_ICONS[m._id] || CreditCard; return <M size={13} />; })()} {m._id}
                        <span className="text-xs text-gray-600">({m.count})</span>
                      </span>
                      <span className="text-gray-900 dark:text-white font-semibold">{formatGhs(m.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-800">
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Jobs by Status</h2>
            <div className="space-y-2">
              {byStatus.map(s => (
                <div key={s._id} className="flex items-center justify-between">
                  <Badge {...statusBadgeProps(s._id)}>{statusLabel(s._id)}</Badge>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top parts used */}
        {topParts.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Top Parts Used</h2>
            <div className="space-y-2.5">
              {topParts.map((p, i) => {
                const margin = p.revenue > 0 ? Math.round(((p.revenue - (p.cost||0)) / p.revenue) * 100) : 0;
                return (
                  <div key={p._id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-4 text-right">{i + 1}</span>
                    <span className="flex-1 text-sm text-gray-600 dark:text-slate-300 truncate">{p._id}</span>
                    <span className="text-xs text-gray-600">{p.timesUsed}×</span>
                    <span className={`text-xs font-medium w-12 text-right ${margin >= 40 ? "text-success dark:text-success-dark" : margin >= 20 ? "text-brand-ink dark:text-brand-400" : "text-error dark:text-error-dark"}`}>{margin}%</span>
                    <span className="text-sm text-brand-ink dark:text-brand-400 font-semibold w-24 text-right">{formatGhs(p.revenue)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Most profitable jobs */}
        {topProfitJobs.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Most Profitable Jobs</h2>
            <div className="space-y-3">
              {topProfitJobs.map((job, i) => {
                const pct = job.totalRevenue > 0 ? Math.round((job.grossProfit / job.totalRevenue) * 100) : 0;
                return (
                  <Link key={job._id} href={`/dashboard/pos/jobs/${job._id}`} className="block hover:opacity-80 transition">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                        <span className="text-xs font-mono text-brand-ink dark:text-brand-400">{job.jobNumber}</span>
                        <span className="text-xs text-gray-600 dark:text-slate-400 truncate">{job.customer?.name}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs font-semibold ${pct >= 50 ? "text-success dark:text-success-dark" : pct >= 25 ? "text-brand-ink dark:text-brand-400" : "text-error dark:text-error-dark"}`}>{pct}%</span>
                        <span className="text-sm font-bold text-success dark:text-success-dark w-24 text-right">{formatGhs(job.grossProfit)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Technician Performance</h2>
            <div className="space-y-3">
              {techs.map(t => {
                const pct = t.jobCount > 0 ? Math.round((t.completed / t.jobCount) * 100) : 0;
                return (
                  <div key={t._id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-slate-300">{t.name}</span>
                      <span className="text-xs text-gray-600">{t.completed}/{t.jobCount} completed ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-800">
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Repairs</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {recent.map(job => {
              const jobTotal = (job.diagnosisFee || 0) + (job.laborCost || 0) +
                (job.parts?.reduce((s, p) => s + (p.priceAtTime || 0) * (p.quantity || 1), 0) || 0);
              return (
                <Link
                  key={job._id}
                  href={`/dashboard/pos/jobs/${job._id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-100/40 dark:hover:bg-slate-800/40 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-brand-ink dark:text-brand-400">{job.jobNumber}</p>
                      <Badge {...statusBadgeProps(job.status)}>{statusLabel(job.status)}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {job.customer?.phone} · {[job.deviceBrand, job.deviceModel].filter(Boolean).join(" ") || "—"}
                      {job.assignedTo && <span className="ml-2 text-gray-600">· {job.assignedTo.name}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatGhs(jobTotal)}</p>
                    <p className="text-xs text-gray-600">{new Date(job.createdAt).toLocaleDateString("en-GH")}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
