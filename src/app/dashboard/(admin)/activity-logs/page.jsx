"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useActivityLogs } from "@/hooks/queries/useActivityLogs";
import { useUsers } from "@/hooks/queries/useUsers";
import DateRangeFilter from "@/components/reports/DateRangeFilter";
import {
  History, Search, RotateCw,
  User, Server, Hash, Network, Fingerprint,
  CheckCircle2, XCircle, ChevronRight,
} from "lucide-react";
import {
  actionLabel, resourceLabel, actorLabel, roleLabel,
  fmtDateTime, changesSummary,
  ACTIVITY_ACTION_LABELS, ACTIVITY_ACTION_GROUPS, ACTIVITY_ACTION_STYLES,
  ACTIVITY_RESOURCE_OPTIONS, ACTIVITY_ROLE_LABELS,
  ACTIVITY_ROLE_STYLES, ACTIVITY_ROLE_OPTIONS,
} from "@/lib/activityLog";
import {
  Badge, Button, Card, EmptyState, Input, Modal,
  PageHeader, Select, Skeleton, Table, TableWrap, Td, Th,
} from "@/components/ui";

const STATUS_OPTIONS = [
  { value: "all",     label: "All" },
  { value: "success", label: "Success" },
  { value: "failure", label: "Failed" },
];

const FALLBACK_PILL = "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";

/** Action / role pills carry the audit taxonomy's own colours — see Badge's tone={null}. */
const ActionPill = ({ action }) => (
  <Badge tone={null} className={ACTIVITY_ACTION_STYLES[action] || FALLBACK_PILL}>
    {actionLabel(action)}
  </Badge>
);

const RolePill = ({ role }) => (
  <Badge tone={null} className={ACTIVITY_ROLE_STYLES[role] || FALLBACK_PILL}>
    {roleLabel(role)}
  </Badge>
);

/** A labelled block inside the detail dialog. */
function DetailBlock({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 flex items-center gap-1.5 font-mono text-eyebrow font-bold uppercase text-gray-600 dark:text-slate-400">
        {Icon && <Icon size={12} aria-hidden="true" />} {label}
      </p>
      {children}
    </div>
  );
}

// ─── Row detail modal ────────────────────────────────────────────────────────

function DetailModal({ log, onClose }) {
  const metadata = useMemo(() => {
    if (!log || !log.metadata) return null;
    const entries = Object.entries(log.metadata).filter(([, v]) =>
      v != null && v !== "" && typeof v !== "object",
    );
    return entries.length ? entries : null;
  }, [log]);

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={actionLabel(log.action)}
      description={fmtDateTime(log.createdAt)}
    >
      <div className="space-y-6">
        <DetailBlock label="Event">
          <p className="text-body-sm leading-relaxed text-gray-900 dark:text-white">
            {log.description || "—"}
          </p>
        </DetailBlock>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailBlock icon={User} label="Actor">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-body-sm font-medium text-gray-900 dark:text-white">{actorLabel(log)}</span>
              <RolePill role={log.actorRole} />
            </div>
            {log.actorEmail && (
              <p className="mt-1 text-caption text-gray-600 dark:text-slate-400">{log.actorEmail}</p>
            )}
          </DetailBlock>

          <DetailBlock icon={Server} label="Resource">
            <p className="text-body-sm font-medium text-gray-900 dark:text-white">
              {resourceLabel(log.resourceType)}
            </p>
            {log.resourceName && (
              <p className="mt-1 truncate text-caption text-gray-600 dark:text-slate-400">{log.resourceName}</p>
            )}
          </DetailBlock>
        </div>

        {Array.isArray(log.changes) && log.changes.length > 0 && (
          <DetailBlock label="Field changes">
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800">
              <TableWrap>
                <Table>
                  <thead>
                    <tr className="bg-paper dark:bg-slate-800">
                      <Th>Field</Th>
                      <Th>Before</Th>
                      <Th>After</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.changes.map((c, i) => (
                      <tr key={i}>
                        <Td className="font-medium">{c.label || c.field}</Td>
                        <Td className="break-all text-gray-600 dark:text-slate-400">{c.before ?? "—"}</Td>
                        <Td className="break-all text-gray-900 dark:text-white">{c.after ?? "—"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </div>
          </DetailBlock>
        )}

        {metadata && (
          <DetailBlock label="Metadata">
            <div className="space-y-1 rounded-xl border border-gray-200 bg-paper p-3 dark:border-slate-800 dark:bg-slate-800/60">
              {metadata.map(([k, v]) => (
                <p key={k} className="text-caption">
                  <span className="font-semibold text-gray-700 dark:text-slate-300">{k}: </span>
                  <span className="break-all text-gray-700 dark:text-slate-300">{String(v)}</span>
                </p>
              ))}
            </div>
          </DetailBlock>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {log.ip && (
            <DetailBlock icon={Network} label="IP">
              <p className="break-all font-mono text-caption text-gray-700 dark:text-slate-300">{log.ip}</p>
            </DetailBlock>
          )}
          {log.requestId && (
            <DetailBlock icon={Fingerprint} label="Request ID">
              <p className="break-all font-mono text-caption text-gray-700 dark:text-slate-300">{log.requestId}</p>
            </DetailBlock>
          )}
          {log.resourceId && (
            <DetailBlock icon={Hash} label="Resource ID">
              <p className="break-all font-mono text-caption text-gray-700 dark:text-slate-300">{log.resourceId}</p>
            </DetailBlock>
          )}
        </div>

        {log.userAgent && (
          <DetailBlock label="User agent">
            <p className="break-all text-caption text-gray-600 dark:text-slate-400">{log.userAgent}</p>
          </DetailBlock>
        )}
      </div>
    </Modal>
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
      limit: 10,
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

  const clearFilters = () => {
    setSearch(""); setAction("all"); setResource("all");
    setRole("all"); setActor("all"); setStatus("all"); setFrom(""); setTo("");
  };

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="mb-4 inline-block text-body-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
        >
          ← Dashboard
        </Link>

        <PageHeader
          title="Activity Log"
          description={`Every security, payment, order, and shop event — recorded for audit.${
            total > 0 ? ` ${total.toLocaleString()} event${total === 1 ? "" : "s"} found.` : ""
          }`}
          actions={
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
              <History size={18} aria-hidden="true" className="text-brand-ink dark:text-brand-400" />
            </span>
          }
        />

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
        <Card padding="sm" className="mb-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
            <div className="relative lg:col-span-2">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-gray-600 dark:text-slate-400"
              />
              <Input
                label="Search activity"
                hideLabel
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description, order no, email…"
                className="pl-10"
              />
            </div>

            <Select label="Filter by action" hideLabel value={actionFilter} onChange={(e) => setAction(e.target.value)}>
              <option value="all">All actions</option>
              {ACTIVITY_ACTION_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.actions.map((a) => (
                    <option key={a} value={a}>{ACTIVITY_ACTION_LABELS[a]}</option>
                  ))}
                </optgroup>
              ))}
            </Select>

            <Select label="Filter by resource" hideLabel value={resourceFilter} onChange={(e) => setResource(e.target.value)}>
              {ACTIVITY_RESOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>

            <Select label="Filter by actor role" hideLabel value={roleFilter} onChange={(e) => setRole(e.target.value)}>
              {ACTIVITY_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="min-w-[200px] flex-1">
              <Select label="Filter by user" hideLabel value={actorFilter} onChange={(e) => setActor(e.target.value)}>
                <option value="all">All users</option>
                {actorOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>

            {/* Status: a toggle group, so each button reports its pressed state. */}
            <div className="flex items-center gap-2" role="group" aria-label="Filter by status">
              {STATUS_OPTIONS.map((s) => (
                <Button
                  key={s.value}
                  size="sm"
                  variant={statusFilter === s.value ? "primary" : "secondary"}
                  aria-pressed={statusFilter === s.value}
                  onClick={() => setStatus(s.value)}
                >
                  {s.label}
                </Button>
              ))}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => logQ.refetch()}
                disabled={logQ.isFetching}
              >
                <RotateCw size={14} aria-hidden="true" className={logQ.isFetching ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card padding="none">
            <div className="space-y-3 p-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 flex-1" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
              ))}
            </div>
          </Card>
        ) : logs.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={History}
              title="No activity matches your filters"
              description={
                hasFilters
                  ? "Widen the date range or clear a filter to see more events."
                  : "Events appear here as staff and customers use the app."
              }
              action={hasFilters ? <Button variant="secondary" onClick={clearFilters}>Clear all filters</Button> : null}
            />
          </Card>
        ) : (
          <>
            <Card padding="none" className="overflow-hidden">
              <TableWrap>
                <Table className="min-w-[900px]">
                  <thead>
                    <tr className="bg-paper dark:bg-slate-800">
                      <Th>Time</Th>
                      <Th>Actor</Th>
                      <Th>Action</Th>
                      <Th>Resource</Th>
                      <Th>Details</Th>
                      <Th>Status</Th>
                      <Th className="text-right">
                        <span className="sr-only-text">Open</span>
                      </Th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const summary = changesSummary(log.changes);
                      return (
                        <tr
                          key={log._id}
                          onClick={() => setSelected(log)}
                          className="cursor-pointer align-top transition-colors hover:bg-paper/80 dark:hover:bg-slate-800/50"
                        >
                          <Td className="whitespace-nowrap font-medium">{fmtDateTime(log.createdAt)}</Td>
                          <Td>
                            <span className="block max-w-[160px] truncate font-medium text-gray-900 dark:text-white">
                              {actorLabel(log)}
                            </span>
                            <span className="mt-1 inline-block">
                              <RolePill role={log.actorRole} />
                            </span>
                          </Td>
                          <Td><ActionPill action={log.action} /></Td>
                          <Td>
                            <div className="max-w-[180px] truncate font-medium text-gray-900 dark:text-white" title={log.resourceName}>
                              {log.resourceName || "—"}
                            </div>
                            <div className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">
                              {resourceLabel(log.resourceType)}
                            </div>
                          </Td>
                          <Td>
                            <p className="max-w-[280px] truncate" title={log.description}>{log.description}</p>
                            {summary && (
                              <p className="mt-0.5 max-w-[280px] truncate text-caption text-gray-600 dark:text-slate-400" title={summary}>
                                {summary}
                              </p>
                            )}
                          </Td>
                          <Td>
                            {log.status === "failure" ? (
                              <Badge tone="error"><XCircle size={12} aria-hidden="true" /> Failed</Badge>
                            ) : (
                              <Badge tone="success"><CheckCircle2 size={12} aria-hidden="true" /> Success</Badge>
                            )}
                          </Td>
                          <Td className="text-right">
                            {/* The row is clickable for the mouse; this is the
                                keyboard and screen-reader way into the detail. */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2"
                              aria-label={`Open details for ${actionLabel(log.action)} at ${fmtDateTime(log.createdAt)}`}
                              onClick={(e) => { e.stopPropagation(); setSelected(log); }}
                            >
                              <ChevronRight size={16} aria-hidden="true" />
                            </Button>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>

            {pages > 1 && (
              <div className="mt-4 flex items-center justify-between px-1">
                <p className="text-caption text-gray-600 dark:text-slate-400">
                  Showing {logs.length} of {total} events
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage(page - 1)}
                  >
                    ← Previous
                  </Button>
                  <span className="self-center text-caption text-gray-600 dark:text-slate-400">
                    Page {page} of {pages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page >= pages || loading}
                    onClick={() => setPage(page + 1)}
                  >
                    Next →
                  </Button>
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
