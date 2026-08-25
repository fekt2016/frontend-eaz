"use client";

import { useState } from "react";
import { Loader2, Receipt, TrendingUp, Users } from "lucide-react";
import { formatGhs } from "@/lib/shop";
import { useAuth } from "@/context/AuthContext";
import { usePosSalesList, usePosSalesSummary } from "@/hooks/queries/usePosSales";

// Sales tracking for the Sell page. Staff see the sales they rang up; admin and
// superadmin additionally get a per-cashier breakdown and can filter the list down
// to one person. The scoping is enforced server-side — this component only decides
// what to *show*, never what the caller is allowed to see.

const ADMIN_ROLES = ["admin", "superadmin"];

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 font-display font-bold text-2xl text-gray-900 dark:text-white">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

const fmtTime = (d) =>
  new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function SalesTracker() {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  // Admin-only filter; staff never send this — and it would be ignored if they did.
  const [cashierId, setCashierId] = useState("");

  const summaryQ = usePosSalesSummary();
  const listQ = usePosSalesList({ limit: 10, ...(isAdmin && cashierId ? { cashierId } : {}) });

  const summary = summaryQ.data;
  const sales = listQ.data?.data ?? [];
  const byStaff = summary?.byStaff ?? [];

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <Receipt size={16} className="text-brand-500" />
        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">
          {isAdmin ? "Sales" : "My sales"}
        </h2>
      </div>

      {summaryQ.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-gray-400 dark:text-slate-500">
          <Loader2 size={14} className="animate-spin" /> Loading sales…
        </p>
      ) : summaryQ.isError ? (
        <p className="text-sm text-red-500 dark:text-red-400">Could not load sales right now.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Today"
              value={formatGhs(summary?.mine?.todayRevenue ?? 0)}
              hint={`${summary?.mine?.todayCount ?? 0} sale${summary?.mine?.todayCount === 1 ? "" : "s"}`}
            />
            <Stat
              label="All time"
              value={formatGhs(summary?.mine?.revenue ?? 0)}
              hint={`${summary?.mine?.count ?? 0} sale${summary?.mine?.count === 1 ? "" : "s"}`}
            />
          </div>

          {isAdmin && byStaff.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-gray-400 dark:text-slate-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sales by staff</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[32rem] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      <th className="pb-2 font-semibold">Staff</th>
                      <th className="pb-2 font-semibold text-right">Today</th>
                      <th className="pb-2 font-semibold text-right">All time</th>
                      <th className="pb-2 font-semibold text-right">Sales</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {byStaff.map((row) => (
                      <tr key={row.cashierId || row.name}>
                        <td className="py-2.5 text-gray-900 dark:text-white">{row.name}</td>
                        <td className="py-2.5 text-right text-gray-600 dark:text-slate-400">
                          {formatGhs(row.todayRevenue)}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-gray-900 dark:text-white">
                          {formatGhs(row.revenue)}
                        </td>
                        <td className="py-2.5 text-right text-gray-600 dark:text-slate-400">{row.count}</td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setCashierId((c) => (c === row.cashierId ? "" : row.cashierId))}
                            aria-pressed={cashierId === row.cashierId}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              cashierId === row.cashierId
                                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                                : "border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500"
                            }`}
                          >
                            {cashierId === row.cashierId ? "Clear" : "View"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-gray-400 dark:text-slate-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Recent sales
                {isAdmin && cashierId && (
                  <span className="ml-1 font-normal text-gray-400 dark:text-slate-500">
                    — {byStaff.find((r) => r.cashierId === cashierId)?.name || "selected staff"}
                  </span>
                )}
              </h3>
            </div>

            {listQ.isLoading ? (
              <p className="flex items-center gap-2 text-sm text-gray-400 dark:text-slate-500">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </p>
            ) : sales.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-6 text-center text-sm text-gray-400 dark:text-slate-500">
                No sales yet. Completed sales will appear here.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-slate-800 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                {sales.map((s) => (
                  <li key={s._id} className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-gray-500 dark:text-slate-400">{s.saleNumber}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {fmtTime(s.createdAt)}
                        {isAdmin && s.cashier?.name ? ` · ${s.cashier.name}` : ""}
                        {` · ${s.paymentMethod}`}
                      </p>
                    </div>
                    <p className="font-display font-bold text-sm text-gray-900 dark:text-white shrink-0">
                      {formatGhs(s.total)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
