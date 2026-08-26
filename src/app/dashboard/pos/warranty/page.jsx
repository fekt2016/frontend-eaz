"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, TriangleAlert, CheckCircle2, XCircle } from "lucide-react";
import { useWarrantyJobs } from "@/hooks/queries/usePosJobs";
import {
  Alert, Badge, Button, Card, EmptyState, PageHeader, Skeleton,
} from "@/components/ui";

const WARRANTY_TONES = {
  active:        "success",
  expiring_soon: "brand",
  expired:       "neutral",
};

const WARRANTY_LABELS = {
  active:        "Active",
  expiring_soon: "Expiring Soon",
  expired:       "Expired",
};

const ICON_TONES = {
  active:        "text-success dark:text-success-dark",
  expiring_soon: "text-brand-ink dark:text-brand-400",
  expired:       "text-gray-600 dark:text-slate-400",
};

function daysLeft(dateStr) {
  const diff = new Date(dateStr) - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function JobWarrantyRow({ job, warrantyStatus }) {
  const expires = job.warrantyExpires ? new Date(job.warrantyExpires) : null;
  const days    = expires ? daysLeft(expires) : null;

  return (
    <Link
      href={`/dashboard/pos/jobs/${job._id}`}
      className="flex items-center justify-between border-b border-gray-100 px-5 py-4 transition-colors last:border-0 hover:bg-paper dark:border-slate-800 dark:hover:bg-slate-800/40"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 dark:border-slate-700 dark:bg-slate-800">
          <ShieldCheck size={14} aria-hidden="true" className={ICON_TONES[warrantyStatus] || ICON_TONES.expired} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-mono text-body-sm font-semibold text-brand-ink dark:text-brand-400">{job.jobNumber}</p>
            <Badge tone={WARRANTY_TONES[warrantyStatus] || "neutral"}>
              {WARRANTY_LABELS[warrantyStatus]}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-caption text-gray-600 dark:text-slate-400">
            {job.customer?.name} · {[job.deviceBrand, job.deviceModel].filter(Boolean).join(" ") || "—"}
          </p>
          {job.warrantyNotes && (
            <p className="truncate text-caption text-gray-600 dark:text-slate-400">{job.warrantyNotes}</p>
          )}
        </div>
      </div>
      <div className="ml-3 flex-shrink-0 text-right">
        <p className="text-caption text-gray-600 dark:text-slate-400">
          {expires ? expires.toLocaleDateString("en-GH", { dateStyle: "medium" }) : "—"}
        </p>
        {days !== null && (
          <p className={`mt-0.5 text-caption font-semibold ${
            days < 0
              ? "text-gray-600 dark:text-slate-400"
              : days <= 7
                ? "text-brand-ink dark:text-brand-400"
                : "text-success dark:text-success-dark"
          }`}>
            {days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? "Today" : `${days}d left`}
          </p>
        )}
      </div>
    </Link>
  );
}

function StatTile({ label, value, sub, icon: Icon, tone }) {
  return (
    <Card padding="sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-eyebrow font-bold uppercase text-gray-600 dark:text-slate-400">{label}</p>
        <Icon size={15} aria-hidden="true" className={tone} />
      </div>
      <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
      <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">{sub}</p>
    </Card>
  );
}

export default function WarrantyPage() {
  const [tab, setTab] = useState("active");

  const { data, isLoading: loading, error: queryError } = useWarrantyJobs();
  const error = queryError?.message || "";

  const activeJobs   = data?.active       || [];
  const expiringSoon = data?.expiringSoon || [];
  const expiredJobs  = data?.expired      || [];

  const trulyActive = activeJobs.filter(
    (j) => j.warrantyStatus === "active" && !expiringSoon.find((e) => e._id === j._id)
  );

  const displayJobs = tab === "active"
    ? trulyActive
    : tab === "expiring"
      ? expiringSoon
      : expiredJobs;

  const TABS = [
    { key: "active",   label: `Active (${trulyActive.length})` },
    { key: "expiring", label: `Expiring Soon (${expiringSoon.length})` },
    { key: "expired",  label: `Expired (${expiredJobs.length})` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warranty Tracker"
        description="Track active warranties and upcoming expirations."
        actions={
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-surface dark:bg-success-surface-dark">
            <ShieldCheck size={18} aria-hidden="true" className="text-success dark:text-success-dark" />
          </span>
        }
      />

      {/* Alert banner — expiring soon */}
      {!loading && expiringSoon.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3.5 dark:border-brand-800/40 dark:bg-brand-900/20"
        >
          <TriangleAlert size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-brand-ink dark:text-brand-400" />
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-brand-ink dark:text-brand-400">
              {expiringSoon.length} warranty{expiringSoon.length !== 1 ? "s" : ""} expiring within 7 days
            </p>
            {/* These chips were text-brand-300 on a pale gold fill — 1.5:1, so
                effectively invisible in light mode. */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {expiringSoon.map(j => (
                <Link
                  key={j._id}
                  href={`/dashboard/pos/jobs/${j._id}`}
                  className="rounded-lg bg-brand-500/15 px-2.5 py-1 font-mono text-caption font-semibold text-brand-ink transition-colors hover:bg-brand-500/30 dark:text-brand-400"
                >
                  {j.jobNumber} · {daysLeft(j.warrantyExpires)}d
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <StatTile
            label="Active" value={activeJobs.length} sub="Valid warranties"
            icon={CheckCircle2} tone="text-success dark:text-success-dark"
          />
          <StatTile
            label="Expiring" value={expiringSoon.length} sub="Within 7 days"
            icon={TriangleAlert} tone="text-brand-ink dark:text-brand-400"
          />
          <StatTile
            label="Expired" value={expiredJobs.length} sub="Last 90 days"
            icon={XCircle} tone="text-gray-600 dark:text-slate-400"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Warranty status">
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

      {/* Jobs list */}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : error ? (
          <div className="p-5"><Alert tone="error">{error}</Alert></div>
        ) : displayJobs.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No warranties in this category"
            description={
              tab === "active"   ? "No active warranties right now." :
              tab === "expiring" ? "No warranties expiring within 7 days." :
              "No expired warranties in the last 90 days."
            }
            action={
              tab !== "active" && trulyActive.length > 0 ? (
                <Button variant="secondary" onClick={() => setTab("active")}>
                  See {trulyActive.length} active
                </Button>
              ) : null
            }
          />
        ) : (
          <div>
            {displayJobs.map(job => (
              <JobWarrantyRow
                key={job._id}
                job={job}
                warrantyStatus={tab === "expired" ? "expired" : job.warrantyStatus}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
