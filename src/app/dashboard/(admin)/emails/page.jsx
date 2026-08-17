"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEmailLogs } from "@/hooks/queries/useEmails";
import {
  Mail, Search, RotateCw, Loader2,
  CheckCircle2, XCircle, Filter,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  welcome:             "Welcome",
  password_reset:      "Password Reset",
  contact_admin:       "Contact (Admin)",
  contact_autoreply:   "Contact (Auto-reply)",
  order_confirmation:  "Order Confirmation",
  payment_received:    "Payment Received",
  hosting_credentials: "Hosting Credentials",
  renewal_reminder:    "Renewal Reminder",
  expired_notice:      "Expired Notice",
  other:               "Other",
};

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const STATUS_OPTIONS = [
  { value: "all",    label: "All" },
  { value: "sent",   label: "Sent" },
  { value: "failed", label: "Failed" },
];

const typeColors = {
  welcome:             "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  password_reset:      "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  contact_admin:       "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  contact_autoreply:   "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  order_confirmation:  "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
  payment_received:    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  hosting_credentials: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  renewal_reminder:    "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  expired_notice:      "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  other:               "bg-paper text-gray-600 dark:bg-slate-800 dark:text-slate-400",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminEmailLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [typeFilter, setType]   = useState("all");
  const [statusFilter, setStatus] = useState("all");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace("/dashboard");
  }, [authLoading, isAdmin, router]);

  const emailQ = useEmailLogs(
    { page, limit: 50, type: typeFilter, status: statusFilter, q: search.trim() },
    { enabled: !authLoading && isAdmin },
  );
  const logs    = emailQ.data?.logs ?? [];
  const total   = emailQ.data?.total ?? 0;
  const pages   = emailQ.data?.pages ?? 1;
  const summary = emailQ.data?.summary ?? { total: 0, sent: 0, failed: 0, today: 0 };
  const loading = emailQ.isLoading;
  const fetchLogs = (pg = 1) => setPage(pg);

  // Reset to page 1 whenever a filter/search changes.
  useEffect(() => { setPage(1); }, [typeFilter, statusFilter, search]);

  if (authLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="mb-4 inline-block text-sm text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Mail size={17} className="text-blue-600 dark:text-blue-400" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Email Logs</h1>
              <p className="text-gray-400 dark:text-slate-500 text-sm">Every email sent by EazWorld — deliveries, failures, and more.</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total sent",   value: summary.total,  accent: "text-gray-900" },
            { label: "Delivered",    value: summary.sent,   accent: "text-emerald-700" },
            { label: "Failed",       value: summary.failed, accent: "text-red-600" },
            { label: "Sent today",   value: summary.today,  accent: "text-blue-700" },
          ].map(({ label, value, accent }) => (
            <div key={label} className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">{label}</p>
              <p className={`mt-2 text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={12} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by recipient email…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-300"
              />
            </div>

            {/* Type filter */}
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={11} />
              <select
                value={typeFilter}
                onChange={(e) => setType(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-300"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Status buttons */}
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button key={s.value} type="button" onClick={() => setStatus(s.value)}
                  className={`text-xs font-semibold px-3 py-2 rounded-full border transition ${statusFilter === s.value ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white" : "bg-paper dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500"}`}>
                  {s.label}
                </button>
              ))}
              <button type="button" onClick={() => fetchLogs(1)} disabled={loading}
className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 transition disabled:opacity-50">
                <RotateCw size={10} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400 dark:text-slate-500">
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <span className="text-sm">Loading logs…</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
            <Mail className="mx-auto text-gray-200 dark:text-slate-700 mb-3" size={32} />
            <p className="text-gray-400 dark:text-slate-500 text-sm">No email logs found.</p>
            {(typeFilter !== "all" || statusFilter !== "all" || search) && (
              <button onClick={() => { setType("all"); setStatus("all"); setSearch(""); }}
                className="mt-3 text-xs text-blue-500 hover:text-blue-600 underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[700px] w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-800 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Recipient</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 whitespace-nowrap">Date &amp; Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-paper/80 dark:hover:bg-slate-800/50">
                        {/* Status */}
                        <td className="px-4 py-3">
                          {log.status === "sent" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 size={11} /> Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400" title={log.error || ""}>
                              <XCircle size={11} /> Failed
                            </span>
                          )}
                        </td>

                        {/* Recipient */}
                        <td className="px-4 py-3">
                          <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px] block">{log.to}</span>
                          {log.status === "failed" && log.error && (
                            <p className="text-xs text-red-400 mt-0.5 truncate max-w-[200px]" title={log.error}>{log.error}</p>
                          )}
                        </td>

                        {/* Subject */}
                        <td className="px-4 py-3">
                          <span className="text-gray-700 dark:text-slate-300 truncate max-w-[240px] block" title={log.subject}>{log.subject}</span>
                        </td>

                        {/* Type badge */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[log.type] || "bg-paper text-gray-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                            {TYPE_LABELS[log.type] || log.type}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-500 whitespace-nowrap">
                          {fmtDate(log.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Showing {logs.length} of {total} logs
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1 || loading}
                    onClick={() => fetchLogs(page - 1)}
                    className="text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 disabled:opacity-40 transition">
                    ← Previous
                  </button>
                  <span className="text-xs text-gray-400 dark:text-slate-500 self-center">Page {page} of {pages}</span>
                  <button
                    disabled={page >= pages || loading}
                    onClick={() => fetchLogs(page + 1)}
                    className="text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 disabled:opacity-40 transition">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
