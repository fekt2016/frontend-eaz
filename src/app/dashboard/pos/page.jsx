"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Wrench, RefreshCw, Clock, TriangleAlert } from "lucide-react";
import { useJobs } from "@/hooks/queries/usePosJobs";
import { ACTIVE_STATUSES, statusBadgeProps, statusLabel } from "@/lib/jobStatus";
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";

function JobRow({ job }) {
  return (
    <Link
      href={`/dashboard/pos/jobs/${job._id}`}
      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper dark:hover:bg-slate-800/50"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="font-mono text-body-sm font-semibold text-gray-900 dark:text-white">{job.jobNumber}</span>
          {job.priority === "urgent" && (
            <Badge tone="error"><TriangleAlert size={11} aria-hidden="true" /> Urgent</Badge>
          )}
        </div>
        <p className="truncate text-caption text-gray-600 dark:text-slate-400">
          {job.customer?.phone}
          {(job.deviceBrand || job.deviceModel) && (
            <span className="ml-2">· {[job.deviceBrand, job.deviceModel].filter(Boolean).join(" ")}</span>
          )}
        </p>
        <p className="mt-0.5 truncate text-caption text-gray-600 dark:text-slate-400">{job.faultDescription}</p>
      </div>
      {job.estimatedCompletion && (
        <div className="hidden flex-shrink-0 items-center gap-1.5 text-caption text-gray-600 dark:text-slate-400 sm:flex">
          <Clock size={12} aria-hidden="true" />
          {new Date(job.estimatedCompletion).toLocaleDateString("en-GH", { dateStyle: "medium" })}
        </div>
      )}
      <span className="flex-shrink-0">
        <Badge {...statusBadgeProps(job.status)}>{statusLabel(job.status)}</Badge>
      </span>
    </Link>
  );
}

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-paper dark:bg-ink">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-brand-400" />
  </div>
);

// POS root: technician/admin see the repair (My Jobs) view here; other roles
// are redirected to their own landing.
export default function PosRoot() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("mine"); // 'mine' | 'all'

  const showJobs = !!user && ["technician", "admin", "staff"].includes(user.role);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login?redirect=/dashboard/pos"); return; }
    if (!["technician", "admin"].includes(user.role)) { router.replace("/dashboard"); }
  }, [user, authLoading, router]);

  const mineQ = useJobs({ assignedTo: "me", limit: 100 }, { enabled: showJobs });
  const allQ  = useJobs({ limit: 100 }, { enabled: showJobs });
  const myJobs  = mineQ.data?.data ?? [];
  const allJobs = (allQ.data?.data ?? []).filter(j => ACTIVE_STATUSES.includes(j.status));
  const loading = mineQ.isLoading || allQ.isLoading;
  const fetchJobs = () => { mineQ.refetch(); allQ.refetch(); };

  // While redirecting a non-technician/admin role (or auth loading), show a spinner.
  if (authLoading || !user || !showJobs) return <Spinner />;

  const jobs = tab === "mine" ? myJobs : allJobs;
  const activeJobs    = jobs.filter(j => ACTIVE_STATUSES.includes(j.status));
  const completedJobs = jobs.filter(j => !ACTIVE_STATUSES.includes(j.status));

  const counts = {
    received: myJobs.filter(j => j.status === "received").length,
    active:   myJobs.filter(j => ["diagnosing","repairing","waiting_for_parts"].includes(j.status)).length,
    ready:    myJobs.filter(j => j.status === "ready").length,
    urgent:   myJobs.filter(j => j.priority === "urgent").length,
  };

  const TABS = [
    { key: "mine", label: `My Jobs (${myJobs.length})` },
    { key: "all",  label: `All Active (${allJobs.length})` },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name?.split(" ")[0]} 👋`}
        description="Technician · Repair Dashboard"
        actions={
          <Button
            variant="secondary"
            size="sm"
            className="px-2.5"
            onClick={fetchJobs}
            aria-label="Refresh jobs"
          >
            <RefreshCw size={15} aria-hidden="true" className={loading ? "animate-spin" : ""} />
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "New / Waiting", value: counts.received, tone: "text-info dark:text-info-dark" },
          { label: "In Progress",   value: counts.active,   tone: "text-brand-ink dark:text-brand-400" },
          { label: "Ready",         value: counts.ready,    tone: "text-success dark:text-success-dark" },
          { label: "Urgent",        value: counts.urgent,   tone: "text-error dark:text-error-dark" },
        ].map(({ label, value, tone }) => (
          <Card key={label} padding="sm" className="text-center">
            <p className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
            <p className="mt-1 text-caption text-gray-600 dark:text-slate-400">{label}</p>
          </Card>
        ))}
      </div>

      {/* Tab toggle */}
      <div className="flex w-fit gap-2" role="group" aria-label="Which jobs to show">
        {TABS.map(t => (
          <Button
            key={t.key}
            size="sm"
            variant={tab === t.key ? "primary" : "secondary"}
            aria-pressed={tab === t.key}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Job list */}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title={tab === "mine" ? "No jobs assigned to you" : "No active jobs"}
            description={
              tab === "mine"
                ? "Jobs assigned to you appear here as soon as the front desk books them in."
                : "Nothing is on the bench right now."
            }
            action={
              tab === "mine" && allJobs.length > 0 ? (
                <Button variant="secondary" onClick={() => setTab("all")}>
                  See all {allJobs.length} active jobs
                </Button>
              ) : (
                <Button href="/dashboard/pos/jobs/new">Book in a new job</Button>
              )
            }
          />
        ) : (
          <div>
            {activeJobs.length > 0 && (
              <div>
                <div className="border-b border-gray-200 bg-paper px-5 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="font-mono text-eyebrow font-bold uppercase text-gray-600 dark:text-slate-400">
                    Active · {activeJobs.length}
                  </p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {activeJobs.map(job => <JobRow key={job._id} job={job} />)}
                </div>
              </div>
            )}

            {completedJobs.length > 0 && (
              <div>
                <div className="border-b border-t border-gray-200 bg-paper px-5 py-2.5 dark:border-slate-800 dark:bg-slate-800/30">
                  <p className="font-mono text-eyebrow font-bold uppercase text-gray-600 dark:text-slate-400">
                    Completed · {completedJobs.length}
                  </p>
                </div>
                <div className="divide-y divide-gray-100 opacity-60 dark:divide-slate-800">
                  {completedJobs.map(job => <JobRow key={job._id} job={job} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
