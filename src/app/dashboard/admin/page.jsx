"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  FaServer, FaGlobe, FaUsers, FaMoneyBillWave,
  FaArrowUp, FaArrowDown, FaExclamationTriangle,
  FaRedo, FaChevronRight, FaSpinner,
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
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent || "bg-gray-100"}`}>
          <Icon size={17} className="text-white" />
        </div>
        {growth != null && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${growth >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {growth >= 0 ? <FaArrowUp size={9} /> : <FaArrowDown size={9} />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-300 mt-0.5">{sub}</p>}
    </div>
  );
}

const statusColors = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-blue-50 text-blue-700",
  active: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
  failed: "bg-red-50 text-red-600",
  completed: "bg-emerald-50 text-emerald-700",
};

export default function AdminOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/dashboard");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/hosting/orders/admin-overview");
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === "admin") fetchData();
  }, [authLoading, user?.role, fetchData]);

  if (authLoading || user?.role !== "admin") return null;

  const d = data;

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-24 pb-24">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Admin Overview</h1>
            <p className="text-gray-400 text-sm mt-1">Revenue, orders, users — all in one place.</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 bg-white text-gray-700 hover:border-gray-300 transition disabled:opacity-50"
          >
            <FaRedo size={11} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Quick nav */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { href: "/dashboard/admin/hosting", label: "Hosting Orders" },
            { href: "/dashboard/admin/domains", label: "Domain Orders" },
            { href: "/dashboard/admin/users", label: "Users" },
            { href: "/dashboard/admin/emails", label: "Email Logs" },
          ].map(({ href, label }) => (
            <Link key={href} href={href}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-700 transition">
              {label} →
            </Link>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <FaSpinner className="animate-spin text-2xl text-amber-500" />
            <span className="text-sm">Loading overview…</span>
          </div>
        ) : !d ? (
          <div className="text-center py-24 text-gray-400 text-sm">Failed to load data. <button onClick={fetchData} className="text-amber-500 underline">Retry</button></div>
        ) : (
          <>
            {/* Alerts */}
            {(d.hosting?.expiringIn7Days > 0 || d.hosting?.pending > 0) && (
              <div className="mb-6 space-y-2">
                {d.hosting?.pending > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <FaExclamationTriangle className="shrink-0 text-amber-500" size={14} />
                    <span><strong>{d.hosting.pending}</strong> hosting order{d.hosting.pending > 1 ? "s" : ""} pending review — <Link href="/dashboard/admin/hosting" className="underline">review now</Link></span>
                  </div>
                )}
                {d.hosting?.expiringIn7Days > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
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
            </div>

            {/* Recent orders */}
            <div className="grid lg:grid-cols-2 gap-6">

              {/* Recent hosting orders */}
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h2 className="font-semibold text-gray-900 text-sm">Recent Hosting Orders</h2>
                  <Link href="/dashboard/admin/hosting" className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1">View all <FaChevronRight size={9} /></Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {(d.recentHostingOrders || []).length === 0 ? (
                    <p className="text-xs text-gray-400 px-5 py-6 text-center">No orders yet</p>
                  ) : (d.recentHostingOrders || []).map((o) => (
                    <Link key={o._id} href={`/dashboard/hosting/${o._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">{o.planType} — {o.tier}</p>
                        <p className="text-xs text-gray-400">{o.customer?.email} · {fmtDate(o.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">GH₵{o.amount}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[o.status] || "bg-gray-50 text-gray-500"}`}>{o.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recent domain orders */}
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h2 className="font-semibold text-gray-900 text-sm">Recent Domain Orders</h2>
                  <Link href="/dashboard/admin/domains" className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1">View all <FaChevronRight size={9} /></Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {(d.recentDomainOrders || []).length === 0 ? (
                    <p className="text-xs text-gray-400 px-5 py-6 text-center">No domain orders yet</p>
                  ) : (d.recentDomainOrders || []).map((o) => (
                    <div key={o._id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 font-mono">{o.domain}</p>
                        <p className="text-xs text-gray-400">{o.email} · {fmtDate(o.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700">GH₵{o.price}</span>
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
