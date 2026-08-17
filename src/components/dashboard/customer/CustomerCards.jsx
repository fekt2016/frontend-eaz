"use client";

// Shared building blocks for the customer dashboard pages — the card
// components, status badges, and the combined data hook. Extracted from the
// old single-tabbed /dashboard page so the Hosting / Domains / Orders pages
// and the Overview all render the same cards.

import Link from "next/link";
import { Server, Globe, ShoppingBag, Wrench } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatGhs } from "@/lib/shop";
import { useHostingOrders } from "@/hooks/queries/useHosting";
import { useDomainOrders } from "@/hooks/queries/useDomains";
import { useMyOrders } from "@/hooks/queries/useOrders";
import { useMyRepairs } from "@/hooks/queries/useRepairs";

export function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const statusConfig = {
  active:    { label: "Active",    cls: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/30", dot: "bg-emerald-500" },
  paid:      { label: "Paid",      cls: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/30",                  dot: "bg-blue-500" },
  pending:   { label: "Pending",   cls: "bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:border-brand-900/30",             dot: "bg-brand-400" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/30",                        dot: "bg-red-400" },
  failed:    { label: "Failed",    cls: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/30",                        dot: "bg-red-400" },
  completed: { label: "Active",    cls: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/30", dot: "bg-emerald-500" },
};

export function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { label: status, cls: "bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-900 dark:text-slate-400", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function StatCard({ icon: Icon, label, value, sub, color }) {
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

export function HostingCard({ order }) {
  const isActive = order.status === "active";
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
            <Server size={16} className="text-brand-500" />
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
          <Globe size={12} className="text-gray-400 dark:text-slate-500" />
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

export function DomainCard({ order }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Globe size={16} className="text-blue-500" />
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

const REPAIR_STATUS = {
  received:          { label: "Received",          cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  diagnosing:        { label: "Diagnosing",        cls: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  waiting_for_parts: { label: "Waiting for Parts", cls: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400" },
  repairing:         { label: "Repairing",         cls: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  ready:             { label: "Ready",             cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  collected:         { label: "Collected",         cls: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300" },
  cancelled:         { label: "Cancelled",         cls: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
};

export function ShopOrderCard({ order }) {
  const items = order.items?.reduce((n, i) => n + (i.qty || 0), 0) || 0;
  return (
    <Link
      href={`/dashboard/orders/${order._id}`}
      className="block bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={15} className="text-brand-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{order.orderNumber}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">{fmtDate(order.createdAt)} · {items} item{items !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <StatusBadge status={order.status} />
          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-2">{formatGhs(order.total)}</p>
        </div>
      </div>
    </Link>
  );
}

export function RepairCard({ job }) {
  const { user } = useAuth();
  const isStaff = ["superadmin", "admin", "staff", "technician"].includes(user?.role);
  // Staff see the POS job detail so they can act on the job; customers land on
  // the public tracking page.
  const href = isStaff && job?._id
    ? `/dashboard/pos/jobs/${job._id}`
    : job.trackingToken ? `/track/${job.trackingToken}` : "#";

  const badge = REPAIR_STATUS[job.status] || REPAIR_STATUS.received;
  const device = [job.deviceBrand, job.deviceModel].filter(Boolean).join(" ") || "Device";
  return (
    <Link
      href={href}
      className="block bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <Wrench size={15} className="text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{device}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-mono truncate">{job.jobNumber} · {fmtDate(job.createdAt)}</p>
          </div>
        </div>
        <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
      </div>
    </Link>
  );
}

// Combined customer dashboard data — shop orders, hosting, domains, repairs.
export function useCustomerData() {
  const hostingQ = useHostingOrders();
  const domainsQ = useDomainOrders();
  const ordersQ = useMyOrders();
  const repairsQ = useMyRepairs();

  const hosting = hostingQ.data ?? [];
  const domains = domainsQ.data ?? [];
  const orders = ordersQ.data ?? [];
  const repairs = repairsQ.data ?? [];
  const loadingHosting = hostingQ.isLoading;
  const loadingDomains = domainsQ.isLoading;
  const loadingOrders = ordersQ.isLoading;
  const loadingRepairs = repairsQ.isLoading;

  const activeHosting = hosting.filter((o) => o.status === "active").length;
  const activeDomains = domains.filter((o) => o.status === "completed").length;
  const pendingOrders = [...hosting, ...domains].filter((o) => o.status === "pending").length;

  return {
    hosting, domains, orders, repairs,
    loadingHosting, loadingDomains, loadingOrders, loadingRepairs,
    activeHosting, activeDomains, pendingOrders,
  };
}