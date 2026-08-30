"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEmailLogs } from "@/hooks/queries/useEmails";
import { isAdminRole } from "@/lib/roles";
import { Mail, Search, RotateCw, CheckCircle2, XCircle, Send, Inbox } from "lucide-react";
import KpiCard from "@/components/reports/KpiCard";
import {
  Badge, Button, Card, EmptyState, Input, PageHeader,
  Select, Skeleton, Table, TableWrap, Td, Th,
} from "@/components/ui";

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
  two_factor:          "2FA Pin",
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

/* Eleven mail types, so these keep their own hues — see Badge's tone={null}. */
const typeColors = {
  welcome:             "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  password_reset:      "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  contact_admin:       "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  contact_autoreply:   "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  order_confirmation:  "bg-brand-50 text-brand-ink dark:bg-brand-900/30 dark:text-brand-400",
  payment_received:    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  hosting_credentials: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  renewal_reminder:    "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  expired_notice:      "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  two_factor:          "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  other:               "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300",
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

  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [typeFilter, setType]     = useState("all");
  const [statusFilter, setStatus] = useState("all");

  const isAdmin = isAdminRole(user?.role);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace("/dashboard");
  }, [authLoading, isAdmin, router]);

  const emailQ = useEmailLogs(
    { page, limit: 10, type: typeFilter, status: statusFilter, q: search.trim() },
    { enabled: !authLoading && isAdmin },
  );
  const logs    = emailQ.data?.logs ?? [];
  const total   = emailQ.data?.total ?? 0;
  const pages   = emailQ.data?.pages ?? 1;
  const summary = emailQ.data?.summary ?? { total: 0, sent: 0, failed: 0, today: 0 };
  const loading = emailQ.isLoading;

  // Reset to page 1 whenever a filter/search changes.
  useEffect(() => { setPage(1); }, [typeFilter, statusFilter, search]);

  if (authLoading || !isAdmin) return null;

  const hasFilters = typeFilter !== "all" || statusFilter !== "all" || search;
  const clearFilters = () => { setType("all"); setStatus("all"); setSearch(""); };

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
          title="Email Logs"
          description="Every email sent by EazWorld — deliveries, failures, and more."
          actions={
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
              <Mail size={18} aria-hidden="true" className="text-brand-ink dark:text-brand-400" />
            </span>
          }
        />

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Total sent" value={summary.total} icon={Mail} />
          <KpiCard label="Delivered" value={summary.sent} icon={CheckCircle2} tone="green" />
          <KpiCard label="Failed" value={summary.failed} icon={XCircle} tone="red" />
          <KpiCard label="Sent today" value={summary.today} icon={Send} tone="blue" />
        </div>

        {/* Toolbar */}
        <Card padding="sm" className="mb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-gray-600 dark:text-slate-400"
              />
              <Input
                label="Search email logs"
                hideLabel
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by recipient email…"
                className="pl-10"
              />
            </div>

            <div className="lg:w-56">
              <Select label="Filter by type" hideLabel value={typeFilter} onChange={(e) => setType(e.target.value)}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
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
              <Button size="sm" variant="secondary" onClick={() => emailQ.refetch()} disabled={emailQ.isFetching}>
                <RotateCw size={14} aria-hidden="true" className={emailQ.isFetching ? "animate-spin" : ""} /> Refresh
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card padding="none">
            <div className="space-y-3 p-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3.5 flex-1" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
              ))}
            </div>
          </Card>
        ) : logs.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={Inbox}
              title="No email logs found"
              description={
                hasFilters
                  ? "No message matches these filters."
                  : "Every transactional email the app sends is recorded here."
              }
              action={hasFilters ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> : null}
            />
          </Card>
        ) : (
          <>
            <Card padding="none" className="overflow-hidden">
              <TableWrap>
                <Table className="min-w-[760px]">
                  <thead>
                    <tr className="bg-paper dark:bg-slate-800">
                      <Th>Status</Th>
                      <Th>Recipient</Th>
                      <Th>Subject</Th>
                      <Th>Type</Th>
                      <Th>Date &amp; Time</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} className="transition-colors hover:bg-paper/80 dark:hover:bg-slate-800/50">
                        <Td>
                          {log.status === "sent" ? (
                            <Badge tone="success"><CheckCircle2 size={12} aria-hidden="true" /> Sent</Badge>
                          ) : (
                            <Badge tone="error" title={log.error || ""}>
                              <XCircle size={12} aria-hidden="true" /> Failed
                            </Badge>
                          )}
                        </Td>
                        <Td>
                          <span className="block max-w-[200px] truncate font-medium text-gray-900 dark:text-white">{log.to}</span>
                          {log.status === "failed" && log.error && (
                            <p
                              className="mt-0.5 max-w-[200px] truncate text-caption text-error dark:text-error-dark"
                              title={log.error}
                            >
                              {log.error}
                            </p>
                          )}
                        </Td>
                        <Td>
                          <span className="block max-w-[240px] truncate" title={log.subject}>{log.subject}</span>
                        </Td>
                        <Td>
                          <Badge tone={null} className={typeColors[log.type] || typeColors.other}>
                            {TYPE_LABELS[log.type] || log.type}
                          </Badge>
                        </Td>
                        <Td className="whitespace-nowrap">{fmtDate(log.createdAt)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </Card>

            {pages > 1 && (
              <div className="mt-4 flex items-center justify-between px-1">
                <p className="text-caption text-gray-600 dark:text-slate-400">
                  Showing {logs.length} of {total} logs
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
                    ← Previous
                  </Button>
                  <span className="self-center text-caption text-gray-600 dark:text-slate-400">
                    Page {page} of {pages}
                  </span>
                  <Button size="sm" variant="secondary" disabled={page >= pages || loading} onClick={() => setPage(page + 1)}>
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
