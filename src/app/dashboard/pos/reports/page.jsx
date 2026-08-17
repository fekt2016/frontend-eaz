"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useReportsAnalytics } from "@/hooks/queries/useReports";
import { formatGhs } from "@/lib/shop";
import {
  Banknote, ShoppingBag, ChartLine, CheckCircle2, Wrench,
  Barcode, Globe, Boxes, Scale,
} from "lucide-react";

import Card from "@/components/reports/Card";
import KpiCard from "@/components/reports/KpiCard";
import DateRangeFilter from "@/components/reports/DateRangeFilter";
import DonutChart from "@/components/reports/DonutChart";
import RevenueChart from "@/components/reports/RevenueChart";
import DataTable from "@/components/reports/DataTable";
import { ErrorState, EmptyState, KpiSkeleton, ChartSkeleton } from "@/components/reports/State";

const ORDER_HEX = {
  pending: "#f59e0b",
  paid: "#3b82f6",
  processing: "#6366f1",
  shipped: "#a855f7",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

const ORDER_BADGE = {
  pending: "bg-brand-500/15 text-brand-600 dark:text-brand-400",
  paid: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  processing: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  shipped: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-red-500/15 text-red-600 dark:text-red-400",
};

const JOB_HEX = {
  received: "#3b82f6",
  diagnosing: "#8b5cf6",
  waiting_for_parts: "#f59e0b",
  repairing: "#6366f1",
  ready: "#10b981",
  collected: "#6b7280",
  cancelled: "#ef4444",
};

const METHOD_HEX = {
  cash: "#10b981",
  momo: "#f59e0b",
  card: "#3b82f6",
  split: "#8b5cf6",
};

function fmtDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" });
}

function deltaPct(current, previous) {
  if (previous == null || previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

function hasAnyRevenue(series) {
  return (series || []).some((d) => d.total > 0);
}

// ─── Section: Revenue & Sales ────────────────────────────────────────────────
function RevenueSalesSection({ data }) {
  const series = data.revenueSeries || [];
  const methods = (data.paymentMethods || []).map((m) => ({
    label: m._id,
    value: m.total,
    color: METHOD_HEX[m._id] || "#94a3b8",
  }));

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card
        title="Revenue Overview"
        subtitle="Daily revenue, stacked by source"
        className="lg:col-span-2"
        bodyClassName="min-h-[240px] flex flex-col justify-center"
      >
        {series.length === 0 || !hasAnyRevenue(series) ? (
          <EmptyState title="No revenue for this period" message="Try widening the date range to see a revenue trend." />
        ) : (
          <RevenueChart series={series} />
        )}
      </Card>

      <Card title="Payment Methods" subtitle="Cash, MoMo & card">
        {methods.length === 0 ? (
          <EmptyState title="No payments" message="No payments recorded for this period." />
        ) : (
          <DonutChart data={methods} valueFormatter={(v) => formatGhs(v)} />
        )}
      </Card>
    </div>
  );
}

// ─── Section: Orders Analytics ───────────────────────────────────────────────
function OrdersSection({ data }) {
  const byStatus = (data.orders?.byStatus || []).map((s) => ({
    label: s._id,
    value: s.count,
    color: ORDER_HEX[s._id] || "#94a3b8",
  }));
  const recent = data.orders?.recent || [];

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card title="Order Status" subtitle="All shop orders in range">
        {byStatus.length === 0 ? (
          <EmptyState title="No orders for this period" />
        ) : (
          <DonutChart data={byStatus} valueFormatter={(v) => `${v} order${v === 1 ? "" : "s"}`} />
        )}
      </Card>

      <Card title="Recent Orders" className="lg:col-span-2" pad={false}>
        <DataTable
          loading={false}
          emptyText="No orders found for this period."
          columns={[
            {
              header: "Order",
              render: (o) => (
                <div>
                  <Link href={`/dashboard/commerce/orders/${o._id}`} className="font-semibold text-gray-900 dark:text-white hover:text-brand-600 font-mono text-xs">
                    {o.orderNumber}
                  </Link>
                  {o.trackingNumber && <span className="block text-[11px] text-gray-400 font-mono mt-0.5">{o.trackingNumber}</span>}
                </div>
              ),
            },
            { header: "Customer", key: "customer", render: (o) => <span className="text-gray-600 dark:text-gray-300">{o.customer?.name || "—"}</span> },
            { header: "Date", render: (o) => <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtDate(o.createdAt)}</span> },
            { header: "Total", render: (o) => <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{formatGhs(o.total)}</span> },
            {
              header: "Status",
              render: (o) => (
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize whitespace-nowrap ${ORDER_BADGE[o.status] || "bg-gray-500/15 text-gray-500 dark:text-gray-400"}`}>
                  {o.status}
                </span>
              ),
            },
          ]}
          rows={recent}
          rowKey="_id"
        />
      </Card>
    </div>
  );
}

// ─── Section: Inventory Analytics ────────────────────────────────────────────
function InventorySection({ data, canSeeCosts }) {
  const inv = data.kpi?.inventory || {};
  const lowStock = data.lowStockParts || [];

  const tiles = [
    { label: "Active Products", value: inv.productCount },
    { label: "Stock Units", value: (inv.units ?? 0).toLocaleString() },
    { label: "Low Stock Items", value: inv.lowStock, alert: (inv.lowStock ?? 0) > 0 },
    { label: "Out of Stock", value: inv.outOfStock, alert: (inv.outOfStock ?? 0) > 0 },
    { label: "Inventory Value", value: formatGhs(inv.valueSell) },
  ];
  if (canSeeCosts) tiles.push({ label: "Inventory Cost", value: formatGhs(inv.valueCost) });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t.label}</p>
            <p className={`mt-1.5 text-xl font-bold ${t.alert ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>{t.value ?? "—"}</p>
          </div>
        ))}
      </div>

      <Card title="Low Stock Items" subtitle="Parts at or below their reorder threshold" pad={false}>
        <DataTable
          loading={false}
          emptyText="Nothing is running low. Stock looks healthy."
          columns={[
            { header: "Part", key: "name", render: (p) => <span className="font-medium text-gray-900 dark:text-white">{p.name}</span> },
            { header: "SKU", render: (p) => <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{p.sku || "—"}</span> },
            { header: "Category", render: (p) => <span className="text-gray-600 dark:text-gray-300 capitalize">{p.category || "—"}</span> },
            { header: "Stock", render: (p) => <span className="font-semibold text-gray-900 dark:text-white">{p.quantity}</span> },
            { header: "Threshold", render: (p) => <span className="text-gray-500 dark:text-gray-400">{p.lowStockThreshold}</span> },
            {
              header: "Status",
              render: (p) => (
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${p.quantity <= 0 ? "bg-red-500/15 text-red-600 dark:text-red-400" : "bg-brand-500/15 text-brand-600 dark:text-brand-400"}`}>
                  {p.quantity <= 0 ? "Out of stock" : "Low stock"}
                </span>
              ),
            },
          ]}
          rows={lowStock}
          rowKey="_id"
        />
      </Card>
    </div>
  );
}

// ─── Section: Repair Analytics ───────────────────────────────────────────────
function RepairSection({ data }) {
  const byStatus = (data.repairs?.byStatus || []).map((s) => ({
    label: s._id,
    value: s.count,
    color: JOB_HEX[s._id] || "#94a3b8",
  }));
  const topParts = data.repairs?.topParts || [];

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card title="Repair Status" subtitle="Jobs across the repair pipeline">
        {byStatus.length === 0 ? (
          <EmptyState title="No repair jobs for this period" />
        ) : (
          <DonutChart data={byStatus} valueFormatter={(v) => `${v} job${v === 1 ? "" : "s"}`} />
        )}
      </Card>

      <Card title="Top Parts Used" subtitle="Highest-value parts on repair jobs" className="lg:col-span-2" pad={false}>
        <DataTable
          loading={false}
          emptyText="No parts used on repair jobs in this period."
          columns={[
            { header: "Part", render: (p) => <span className="font-medium text-gray-900 dark:text-white">{p._id}</span> },
            { header: "Times Used", render: (p) => <span className="text-gray-600 dark:text-gray-300">{p.timesUsed}</span> },
            { header: "Revenue", render: (p) => <span className="font-medium text-gray-900 dark:text-white">{formatGhs(p.revenue)}</span> },
            {
              header: "Margin",
              render: (p) => {
                const margin = p.revenue > 0 ? Math.round(((p.revenue - (p.cost || 0)) / p.revenue) * 100) : 0;
                return (
                  <span className={`text-xs font-semibold ${margin >= 40 ? "text-emerald-600 dark:text-emerald-400" : margin >= 20 ? "text-brand-600 dark:text-brand-400" : "text-red-600 dark:text-red-400"}`}>
                    {margin}%
                  </span>
                );
              },
            },
          ]}
          rows={topParts}
          rowKey="_id"
        />
      </Card>
    </div>
  );
}

// ─── Section: Shipping & Fulfilment ──────────────────────────────────────────
function ShippingSection({ data }) {
  const byStatus = data.shipping?.byStatus || [];
  const pipeline = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
  const total = byStatus.reduce((s, x) => s + x.count, 0);

  return (
    <Card title="Shipping & Fulfilment" subtitle="Shop order journey through fulfilment">
      {total === 0 ? (
        <EmptyState title="No shipments for this period" message="No shop orders were created in the selected range." />
      ) : (
        <div className="space-y-4">
          {pipeline.map((status) => {
            const item = byStatus.find((s) => s._id === status);
            const count = item?.count || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={status}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300 capitalize">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ORDER_HEX[status] || "#94a3b8" }} />
                    {status}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">{count} · {pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: ORDER_HEX[status] || "#94a3b8" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Section: Top products ───────────────────────────────────────────────────
function TopProductsSection({ data }) {
  const top = data.topProducts || [];
  return (
    <Card title="Top Selling Products" subtitle="By revenue from online orders & POS sales" pad={false}>
      <DataTable
        loading={false}
        emptyText="No product sales in this period."
        columns={[
          { header: "Product", render: (p) => <span className="font-medium text-gray-900 dark:text-white">{p._id}</span> },
          { header: "Units Sold", render: (p) => <span className="text-gray-600 dark:text-gray-300">{p.unitsSold}</span> },
          { header: "Revenue", render: (p) => <span className="font-medium text-gray-900 dark:text-white">{formatGhs(p.revenue)}</span> },
          {
            header: "Share",
            render: (p) => {
              const total = top.reduce((s, x) => s + x.revenue, 0);
              const pct = total > 0 ? Math.round((p.revenue / total) * 100) : 0;
              return (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 min-w-[60px] bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-9 text-right">{pct}%</span>
                </div>
              );
            },
          },
        ]}
        rows={top}
        rowKey="_id"
      />
    </Card>
  );
}

// ─── Section: Expenses (admin/superadmin only) ───────────────────────────────
function ExpensesSection({ data }) {
  const cats = data.expenseByCategory || [];
  const totalExp = data.kpi?.expenses?.total || 0;

  return (
    <Card title="Expenses by Category" subtitle="Running costs in the selected period">
      {cats.length === 0 ? (
        <EmptyState title="No expenses for this period" message="No costs were recorded in the selected range." />
      ) : (
        <>
          <div className="space-y-3">
            {cats.map((e) => {
              const pct = totalExp > 0 ? Math.round((e.total / totalExp) * 100) : 0;
              return (
                <div key={e._id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-300 capitalize">{e._id}</span>
                    <span className="text-gray-500 dark:text-gray-400">{formatGhs(e.total)} · {pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-red-400/70" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Total Expenses</span>
            <span className="font-semibold text-red-600 dark:text-red-400">{formatGhs(totalExp)}</span>
          </div>
        </>
      )}
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
function dayStr(d) {
  return d.toISOString().slice(0, 10);
}

function defaultRange() {
  const t = new Date();
  const f = new Date(t);
  f.setDate(t.getDate() - 30);
  return { from: dayStr(f), to: dayStr(t) };
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState(defaultRange);

  const isTech = user?.role === "technician";
  const { data, isPending, isFetching, isError, error, refetch } = useReportsAnalytics(range, {
    enabled: !isTech,
  });

  const canSeeCosts = ["superadmin", "admin"].includes(user?.role);
  const showExpenses = canSeeCosts && data?.kpi?.expenses?.canSeeExpenses;

  const kpi = useMemo(() => data?.kpi, [data]);

  const onRangeChange = (from, to) => setRange({ from, to });

  // ── technician guard (nav already hides Reports; direct URL gets a friendly stop)
  if (isTech) {
    return (
      <div className="max-w-3xl">
        <Card>
          <EmptyState title="Reports are not available for technicians" message="Ask an admin or staff member for shop-wide reports." />
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 max-w-6xl">
        <Header />
        <ErrorState
          title="Unable to load reports"
          message={error?.message || "Something went wrong while fetching analytics."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <Header refreshing={isFetching} />

      <DateRangeFilter from={range.from} to={range.to} onChange={onRangeChange} onRefresh={() => refetch()} refreshing={isFetching} />

      {/* KPI summary */}
      {isPending ? (
        <KpiSkeleton count={9} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Total Revenue"
            value={formatGhs(kpi.revenue.total)}
            icon={Banknote}
            tone="green"
            delta={data.previous ? { value: data.previous.revenueChangePct } : null}
            sub={data.previous ? "vs previous period" : "All time"}
          />
          <KpiCard
            label="Total Orders"
            value={kpi.orders.total}
            icon={ShoppingBag}
            tone="brand"
            delta={data.previous ? { value: data.previous.ordersChangePct } : null}
            sub={data.previous ? "vs previous period" : "All time"}
          />
          <KpiCard
            label="Avg Order Value"
            value={formatGhs(kpi.orders.aov)}
            icon={ChartLine}
            tone="blue"
            delta={data.previous && data.previous.aov > 0 ? { value: deltaPct(kpi.orders.aov, data.previous.aov) } : null}
            sub="Per paid order"
          />
          <KpiCard label="Completed Orders" value={kpi.orders.paid} icon={CheckCircle2} tone="green" sub="Paid & fulfilled" />
          <KpiCard label="Repair Revenue" value={formatGhs(kpi.repairs.revenue)} icon={Wrench} tone="brand" sub={`${kpi.repairs.completed} collected`} />
          <KpiCard label="POS Sales" value={formatGhs(kpi.revenue.posSales)} icon={Barcode} tone="blue" sub="Over-the-counter" />
          <KpiCard label="Online Shop Revenue" value={formatGhs(kpi.revenue.shopOrders)} icon={Globe} tone="purple" sub="Shop orders" />
          <KpiCard label="Inventory Value" value={formatGhs(kpi.inventory.valueSell)} icon={Boxes} tone="gray" sub={`${(kpi.inventory.units ?? 0).toLocaleString()} units`} />
          {showExpenses && (
            <KpiCard
              label="Net Profit"
              value={formatGhs(kpi.expenses.netProfit)}
              icon={Scale}
              tone={(kpi.expenses.netProfit || 0) >= 0 ? "green" : "red"}
              sub="Revenue minus expenses"
            />
          )}
        </div>
      )}

      {isPending ? (
        <>
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2"><ChartSkeleton /></div>
            <ChartSkeleton />
          </div>
          <ChartSkeleton />
        </>
      ) : (
        <>
          <RevenueSalesSection data={data} />
          <OrdersSection data={data} />
          <InventorySection data={data} canSeeCosts={canSeeCosts} />
          <RepairSection data={data} />
          <div className="grid lg:grid-cols-3 gap-5">
            <ShippingSection data={data} />
            <div className="lg:col-span-2"><TopProductsSection data={data} /></div>
          </div>
          {showExpenses && <ExpensesSection data={data} />}
        </>
      )}
    </div>
  );
}

function Header({ refreshing }) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports &amp; Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Monitor sales, orders, inventory, repairs, payments and shipping performance.
        </p>
      </div>
      {refreshing && (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="w-3 h-3 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
          Updating…
        </span>
      )}
    </div>
  );
}
