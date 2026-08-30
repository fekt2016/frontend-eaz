"use client";

import { useState } from "react";
import { Plus, Search, Wrench, TriangleAlert } from "lucide-react";
import { useJobs } from "@/hooks/queries/usePosJobs";
import { ALL_STATUSES, statusBadgeProps, statusLabel } from "@/lib/jobStatus";
import {
  Alert, Badge, Button, Card, EmptyState, Input,
  PageHeader, Skeleton, Table, TableWrap, Td, Th,
} from "@/components/ui";

/*
 * Derived from the shared status list, so a status can never again be missing
 * here — `waiting_for_parts` used to have no tab and no colour on this page.
 */
const STATUS_TABS = [
  { key: "all", label: "All" },
  ...ALL_STATUSES.map((s) => ({ key: s, label: statusLabel(s) })),
];

export default function JobsPage() {
  const [status,  setStatus]  = useState("all");
  const [q,       setQ]       = useState("");
  const [page,    setPage]    = useState(1);
  // Owner decision (2026-08-30): 10 per page everywhere.
  const limit = 10;

  const jobsQuery = useJobs({ page, limit, status, q: q.trim() });
  const jobs    = jobsQuery.data?.data ?? [];
  const total   = jobsQuery.data?.total ?? 0;
  const loading = jobsQuery.isLoading;
  const error   = jobsQuery.error?.message || "";

  const handleSearch = (e) => { setQ(e.target.value); setPage(1); };
  const handleStatus = (s) => { setStatus(s); setPage(1); };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Repair Jobs"
        description={`${total} total jobs`}
        actions={
          <Button href="/dashboard/pos/jobs/new">
            <Plus size={15} aria-hidden="true" /> New job
          </Button>
        }
      />

      <Alert tone="error">{error}</Alert>

      <div className="relative">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-gray-600 dark:text-slate-400"
        />
        <Input
          label="Search jobs"
          hideLabel
          type="search"
          value={q}
          onChange={handleSearch}
          placeholder="Search by job #, customer name, device…"
          className="pl-10"
        />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by status">
        {STATUS_TABS.map(t => (
          <Button
            key={t.key}
            size="sm"
            variant={status === t.key ? "primary" : "secondary"}
            aria-pressed={status === t.key}
            onClick={() => handleStatus(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No jobs found"
            description="Try a different status filter or search, or book in a new repair."
            action={
              status !== "all" || q ? (
                <Button variant="secondary" onClick={() => { setStatus("all"); setQ(""); setPage(1); }}>
                  Clear filters
                </Button>
              ) : (
                <Button href="/dashboard/pos/jobs/new">
                  <Plus size={15} aria-hidden="true" /> New job
                </Button>
              )
            }
          />
        ) : (
          <TableWrap>
            <Table className="min-w-[820px]">
              <thead>
                <tr className="bg-paper dark:bg-slate-800">
                  <Th>Job #</Th>
                  <Th>Customer</Th>
                  <Th>Device</Th>
                  <Th>Fault</Th>
                  <Th>Assigned</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job._id} className="transition-colors hover:bg-paper/80 dark:hover:bg-slate-800/40">
                    <Td>
                      <div className="flex items-center gap-2">
                        {job.priority === "urgent" && (
                          <>
                            <TriangleAlert size={13} aria-hidden="true" className="flex-shrink-0 text-error dark:text-error-dark" />
                            <span className="sr-only-text">Urgent.</span>
                          </>
                        )}
                        <span className="whitespace-nowrap font-mono font-semibold text-brand-ink dark:text-brand-400">
                          {job.jobNumber}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <p className="max-w-[160px] truncate text-gray-900 dark:text-white">{job.customer?.phone || "—"}</p>
                        {job.customerRepairCount > 1 && (
                          <Badge tone="brand" title={`${job.customerRepairCount} repairs for this customer`}>
                            {job.customerRepairCount}×
                          </Badge>
                        )}
                      </div>
                      {job.customer?.name && (
                        <p className="max-w-[160px] truncate text-caption text-gray-600 dark:text-slate-400">
                          {job.customer.name}
                        </p>
                      )}
                    </Td>
                    <Td className="max-w-[140px] truncate">
                      {[job.deviceBrand, job.deviceModel].filter(Boolean).join(" ").slice(0, 20) || "—"}
                    </Td>
                    <Td className="max-w-[160px] truncate" title={job.faultDescription}>
                      {job.faultDescription?.slice(0, 30)}{job.faultDescription?.length > 30 ? "…" : ""}
                    </Td>
                    <Td className="whitespace-nowrap">{job.assignedTo?.name || "—"}</Td>
                    <Td>
                      <Badge {...statusBadgeProps(job.status)} className="whitespace-nowrap">
                        {statusLabel(job.status)}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {new Date(job.createdAt).toLocaleDateString("en-GH")}
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      <Button size="sm" variant="secondary" href={`/dashboard/pos/jobs/${job._id}`}>
                        View
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      {total > limit && (
        <div className="flex items-center justify-between text-body-sm text-gray-600 dark:text-slate-400">
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              ← Prev
            </Button>
            <Button size="sm" variant="secondary" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
