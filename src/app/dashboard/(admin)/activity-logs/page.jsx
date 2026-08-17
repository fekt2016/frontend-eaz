"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useActivityLogs } from "@/hooks/queries/useActivityLogs";
import { useUsers } from "@/hooks/queries/useUsers";
import DateRangeFilter from "@/components/reports/DateRangeFilter";
import {
  FaHistory, FaSearch, FaRedo, FaSpinner, FaTimes,
  FaUser, FaServer, FaHashtag, FaNetworkWired, FaFingerprint,
  FaCheckCircle, FaTimesCircle, FaChevronDown,
} from "react-icons/fa";
import {
  actionLabel, resourceLabel, actorLabel, roleLabel,
  fmtDateTime, changesSummary,
  ACTIVITY_ACTION_LABELS, ACTIVITY_ACTION_GROUPS, ACTIVITY_ACTION_STYLES,
  ACTIVITY_RESOURCE_OPTIONS, ACTIVITY_ROLE_LABELS,
  ACTIVITY_ROLE_STYLES, ACTIVITY_ROLE_OPTIONS,
} from "@/lib/activityLog";

const STATUS_OPTIONS = [
  { value: "all",     label: "All" },
  { value: "success", label: "Success" },
  { value: "failure", label: "Failed" },
];

// ─── Row detail modal ────────────────────────────────────────────────────────

function DetailModal({ log, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const metadata = useMemo(() => {
    if (!log || !log.metadata) return null;
    const entries = Object.entries(log.metadata).filter(([, v]) =>
      v != null && v !== "" && typeof v !== "object",
    );
    return entries.length ? entries : null;
  }, [log]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Activity log details"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ACTIVITY_ACTION_STYLES[log.action] || "bg-paper text-gray-600 dark:bg-slate-800 dark:text-slate-400"}`}>
              {actionLabel(log.action)}
            </span>
            <span className="text-xs text-gray-400 dark:text-slate-500">{fmtDateTime(log.createdAt)}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition" aria-label="Close">
            <FaTimes size={13} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Description */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5">Event</p>
            <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{log.description || "—"}</p>
          </div>

          {/* Actor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5 flex items-center gap-1.5">
                <FaUser size={10} /> Actor
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{actorLabel(log)}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${ACTIVITY_ROLE_STYLES[log.actorRole] || "bg-paper text-gray-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                  {roleLabel(log.actorRole)}
                </span>
              </div>
              {log.actorEmail && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{log.actorEmail}</p>}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1.5 flex items-center gap-1.5">
                <FaServer size={10} /> Resource
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{resourceLabel(log.resourceType)}</p>
              {log.resourceName && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 truncate">{log.resourceName}</p>}
            </div>
          </div>

          {/* Changes */}
          {Array.isArray(log.changes) && log.changes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-2">Field changes</p>
              <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left bg-paper dark:bg-slate-800 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                      <th className="px-4 py-2">Field</th>
                      <th className="px-4 py-2">Before</th>
                      <th className="px-4 py-2">After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {log.changes.map((c, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-300">{c.label || c.field}</td>
                        <td className="px-4 py-2 text-xs text-gray-500 dark:text-slate-500 break-all">{c.before ?? "—"}</td>
                        <td className="px-4 py-2 text-xs text-gray-900 dark:text-white break-all">{c.after ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Metadata */}
          {metadata && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-2">Metadata</p>
              <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-800/60 p-3 space-y-1">
                {metadata.map(([k, v]) => (
                  <p key={k} className="text-xs">
                    <span className="font-semibold text-gray-500 dark:text-slate-400">{k}: </span>
                    <span className="text-gray-800 dark:text-slate-200 break-all">{String(v)}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Request trail */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {log.ip && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1.5">
                  <FaNetworkWired size={10} /> IP
                </p>
                <p className="text-xs text-gray-700 dark:text-slate-300 font-mono break-all">{log.ip}</p>
              </div>
            )}
            {log.requestId && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1.5">
                  <FaFingerprint size={10} /> Request ID
                </p>
                <p className="text-xs text-gray-700 dark:text-slate-300 font-mono break-all">{log.requestId}</p>
              </div>
            )}
            {log.resourceId && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1.5">
                  <FaHashtag size={10} /> Resource ID
                </p>
                <p className="text-xs text-gray-700 dark:text-slate-300 font-mono break-all">{log.resourceId}</p>
              </div>
            )}
          </div>

          {log.userAgent && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500 mb-1">User agent</p>
              <p className="text-xs text-gray-500 dark:text-slate-500 break-all">{log.userAgent}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ActivityLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [page, setPage]      = useState(1);
  const [search, setSearch]  = useState("");
  const [actionFilter, setAction] = useState("all");
  const [resourceFilter, setResource] = useState("all");
  const [roleFilter, setRole] = useState("all");
  const [actorFilter, setActor] = useState("all");
  const [statusFilter, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState(null);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const usersQ = useUsers({ enabled: !authLoading && isAdmin });
  const users = usersQ.data ?? [];

  const logQ = useActivityLogs(
    {
      page,
      limit: 50,
      q: search.trim(),
      action: actionFilter,
      resourceType: resourceFilter,
      role: roleFilter,
      actor: actorFilter,
      status: statusFilter,
      from: from || undefined,
      to: to || undefined,
    },
    { enabled: !authLoading && isAdmin },
  );
  const logs   = logQ.data?.logs ?? [];
  const total  = logQ.data?.total ?? 0;
  const pages  = logQ.data?.pages ?? 1;
  const loading = logQ.isLoading;

  // Reset to page 1 whenever any filter/search/date changes.
  useEffect(() => { setPage(1); }, [
    search, actionFilter, resourceFilter, roleFilter, actorFilter, statusFilter, from, to,
  ]);

  // The (admin) route group layout already guards this page, but keep the
  // double-check for deep links that bypass it.
  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace("/dashboard");
  }, [authLoading, isAdmin, router]);

  if (authLoading || !isAdmin) return null;

  const actorOptions = users
    .filter((u) => u._id)
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .map((u) => ({
      value: u._id,
      label: `${u.name || u.email}${u.role ? ` · ${ACTIVITY_ROLE_LABELS[u.role] || u.role}` : ""}`,
    }));

  const hasFilters =
    search.trim() || actionFilter !== "all" || resourceFilter !== "all" ||
    roleFilter !== "all" || actorFilter !== "all" || statusFilter !== "all" || from || to;

  return (
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="mb-4 inline-block text-sm text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-11 h-11 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <FaHistory size={17} className="text-brand-600 dark:text-brand-400" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Activity Log</h1>
              <p className="text-gray-400 dark:text-slate-500 text-sm">
                Every security, payment, order, and shop event — recorded for audit. {total > 0 && `${total.toLocaleString()} event${total === 1 ? "" : "s"} found.`}
              </p>
            </div>
          </div>
        </div>

        {/* Date range + refresh */}
        <div className="mb-4">
          <DateRangeFilter
            from={from}
            to={to}
            onChange={(f, t) => { setFrom(f); setTo(t); }}
            onRefresh={() => logQ.refetch()}
            refreshing={logQ.isFetching}
          />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">

            {/* Search */}
            <div className="relative lg:col-span-2">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={12} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description, order no, email…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-300"
              />
            </div>

            {/* Action */}
            <div className="relative">
              <select
                value={actionFilter}
                onChange={(e) => setAction(e.target.value)}
                className="appearance-none w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                aria-label="Filter by action"
              >
                <option value="all">All actions</option>
                {ACTIVITY_ACTION_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.actions.map((a) => (
                      <option key={a} value={a}>{ACTIVITY_ACTION_LABELS[a]}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <FaChevronDown size={10} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            </div>

            {/* Resource */}
            <div className="relative">
              <select
                value={resourceFilter}
                onChange={(e) => setResource(e.target.value)}
                className="appearance-none w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                aria-label="Filter by resource"
              >
                {ACTIVITY_RESOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <FaChevronDown size={10} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            </div>

            {/* Role */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRole(e.target.value)}
                className="appearance-none w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                aria-label="Filter by actor role"
              >
                {ACTIVITY_ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <FaChevronDown size={10} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            {/* Actor */}
            <div className="relative flex-1 min-w-[200px]">
              <select
                value={actorFilter}
                onChange={(e) => setActor(e.target.value)}
                className="appearance-none w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                aria-label="Filter by user"
              >
                <option value="all">All users</option>
                {actorOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <FaChevronDown size={10} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            </div>

            {/* Status buttons */}
            <div className="flex items-center gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button key={s.value} type="button" onClick={() => setStatus(s.value)}
                  className={`text-xs font-semibold px-3 py-2 rounded-full border transition ${statusFilter === s.value ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white" : "bg-paper dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500"}`}>
                  {s.label}
                </button>
              ))}
              <button type="button" onClick={() => logQ.refetch()} disabled={logQ.isFetching}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 transition disabled:opacity-50">
                <FaRedo size={10} className={logQ.isFetching ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400 dark:text-slate-500">
            <FaSpinner className="animate-spin text-2xl text-brand-500" />
            <span className="text-sm">Loading activity…</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
            <FaHistory className="mx-auto text-gray-200 dark:text-slate-700 mb-3" size={32} />
            <p className="text-gray-400 dark:text-slate-500 text-sm">No activity matches your filters.</p>
            {hasFilters && (
              <button
                onClick={() => { setSearch(""); setAction("all"); setResource("all"); setRole("all"); setActor("all"); setStatus("all"); setFrom(""); setTo(""); }}
                className="mt-3 text-xs text-brand-500 hover:text-brand-600 underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-800 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Actor</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Resource</th>
                      <th className="px-4 py-3">Details</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {logs.map((log) => {
                      const summary = changesSummary(log.changes);
                      return (
                        <tr key={log._id} onClick={() => setSelected(log)} className="hover:bg-paper/80 dark:hover:bg-slate-800/50 cursor-pointer align-top">
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-500 whitespace-nowrap">
                            <div className="font-medium text-gray-700 dark:text-slate-300">{fmtDateTime(log.createdAt)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-900 dark:text-white font-medium truncate max-w-[160px] block">{actorLabel(log)}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium mt-1 ${ACTIVITY_ROLE_STYLES[log.actorRole] || "bg-paper text-gray-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                              {roleLabel(log.actorRole)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ACTIVITY_ACTION_STYLES[log.action] || "bg-paper text-gray-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                              {actionLabel(log.action)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-900 dark:text-white text-xs font-medium truncate max-w-[180px]" title={log.resourceName}>{log.resourceName || "—"}</div>
                            <div className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{resourceLabel(log.resourceType)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-gray-700 dark:text-slate-300 text-xs truncate max-w-[280px]" title={log.description}>{log.description}</p>
                            {summary && <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 truncate max-w-[280px]" title={summary}>{summary}</p>}
                          </td>
                          <td className="px-4 py-3">
                            {log.status === "failure" ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                                <FaTimesCircle size={11} /> Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                <FaCheckCircle size={11} /> Success
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Showing {logs.length} of {total} events
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1 || loading}
                    onClick={() => setPage(page - 1)}
                    className="text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 disabled:opacity-40 transition">
                    ← Previous
                  </button>
                  <span className="text-xs text-gray-400 dark:text-slate-500 self-center">Page {page} of {pages}</span>
                  <button
                    disabled={page >= pages || loading}
                    onClick={() => setPage(page + 1)}
                    className="text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 disabled:opacity-40 transition">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selected && <DetailModal log={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
