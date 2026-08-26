"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAllReviews, useApproveReview, useDeleteReview } from "@/hooks/queries/useReviews";
import {
  useAllProductReviews,
  useApproveProductReview,
  useDeleteProductReview,
} from "@/hooks/queries/useProductReviews";
import { RotateCw, Check, X, Trash2, Star, Search } from "lucide-react";
import {
  Badge, Button, Card, ConfirmDialog, EmptyState,
  Input, PageHeader, Skeleton,
} from "@/components/ui";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/** The rating has to be readable, not just visible — hence the sr-only text. */
function StarRating({ rating = 0 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          aria-hidden="true"
          className={s <= rating ? "fill-brand-400 text-brand-400" : "text-gray-300 dark:text-slate-700"}
        />
      ))}
      <span className="sr-only-text">{rating} out of 5 stars</span>
    </span>
  );
}

const SERVICE_COLORS = {
  "Web Design":       "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "SEO":              "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Paid Advertising": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Branding":         "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Social Media":     "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "Email Marketing":  "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "Phone Repair":     "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

const FILTERS = [
  { value: "all",      label: "All" },
  { value: "pending",  label: "Pending" },
  { value: "approved", label: "Approved" },
];

function FilterBar({ filter, setFilter, search, setSearch, pendingCount, placeholder, label }) {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <div className="flex gap-2" role="group" aria-label="Filter reviews by approval">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "primary" : "secondary"}
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
          >
            {f.value === "pending" && pendingCount > 0 ? `Pending (${pendingCount})` : f.label}
          </Button>
        ))}
      </div>

      <div className="relative min-w-[200px] flex-1">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-gray-600 dark:text-slate-400"
        />
        <Input
          label={label}
          hideLabel
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
    </div>
  );
}

/*
 * One panel serves both tabs.
 *
 * Service and product reviews had two ~110-line copies of this component that
 * differed only in field names and three strings — so a fix to one (the missing
 * approve/unapprove labelling, say) reached only half the page. `adapt` maps a
 * record of either shape onto the fields the card renders.
 */
function ReviewsPanel({ heading, query, approveMutation, deleteMutation, adapt, searchFields, copy }) {
  const [filter, setFilter] = useState("all"); // all | pending | approved
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reviews = query.data ?? [];
  const loading = query.isLoading;

  const isActing = (id) =>
    (approveMutation.isPending && approveMutation.variables?.id === id) ||
    (deleteMutation.isPending && deleteMutation.variables === id);

  const setApproval = (id, approved) => approveMutation.mutate({ id, approved });

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget._id, { onSettled: () => setDeleteTarget(null) });
  };

  const pending  = reviews.filter((r) => !r.approved).length;
  const approved = reviews.filter((r) =>  r.approved).length;

  const q = search.toLowerCase();
  const filtered = reviews
    .filter((r) => {
      if (filter === "pending")  return !r.approved;
      if (filter === "approved") return  r.approved;
      return true;
    })
    .filter((r) => !q || searchFields(r).some((v) => v?.toLowerCase().includes(q)));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          {/* h2, not h1 — the page above already owns the <h1>. */}
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white">{heading}</h2>
          <p className="mt-1 text-body-sm text-gray-600 dark:text-slate-400">
            {reviews.length} total · {approved} approved · {pending} pending
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => query.refetch()} disabled={loading}>
          <RotateCw size={15} aria-hidden="true" className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Total",    value: reviews.length, tone: "" },
          { label: "Approved", value: approved,       tone: "text-success dark:text-success-dark" },
          { label: "Pending",  value: pending,        tone: pending > 0 ? "text-brand-ink dark:text-brand-400" : "" },
        ].map(({ label, value, tone }) => (
          <Card key={label} padding="sm" className="text-center">
            <p className={`text-2xl font-bold tabular-nums ${tone || "text-gray-900 dark:text-white"}`}>{value}</p>
            <p className="mt-1 text-caption text-gray-600 dark:text-slate-400">{label}</p>
          </Card>
        ))}
      </div>

      <FilterBar
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
        pendingCount={pending}
        placeholder={copy.placeholder}
        label={copy.searchLabel}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Star}
            title={copy.emptyTitle}
            description={copy.emptyBody}
            action={
              filter !== "all" || search ? (
                <Button variant="secondary" onClick={() => { setFilter("all"); setSearch(""); }}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const { author, initial, tag, body } = adapt(r);
            return (
              <Card
                key={r._id}
                className={!r.approved ? "border-brand-200 dark:border-brand-800/40" : ""}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-body-sm font-bold text-brand-ink dark:bg-brand-900/30 dark:text-brand-400">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-body-sm font-semibold text-gray-900 dark:text-white">{author}</p>
                        {tag}
                        {!r.approved && <Badge tone="brand">Pending</Badge>}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <StarRating rating={r.rating} />
                        <span className="text-caption text-gray-600 dark:text-slate-400">{fmtDate(r.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-body-sm leading-relaxed text-gray-700 dark:text-slate-300">{body}</p>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    {!r.approved ? (
                      <Button
                        size="sm"
                        onClick={() => setApproval(r._id, true)}
                        loading={isActing(r._id)}
                        aria-label={`Approve review by ${author}`}
                      >
                        <Check size={14} aria-hidden="true" /> Approve
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setApproval(r._id, false)}
                        loading={isActing(r._id)}
                        aria-label={`Unapprove review by ${author}`}
                      >
                        <X size={14} aria-hidden="true" /> Unapprove
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 text-error dark:text-error-dark"
                      onClick={() => setDeleteTarget(r)}
                      aria-label={`Delete review by ${author}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleteMutation.isPending}
        title={copy.deleteTitle}
        description={copy.deleteBody}
        confirmLabel="Delete review"
      >
        <p className="text-body-sm text-gray-600 dark:text-slate-400">
          To take it off the public site without losing it, unapprove it instead.
        </p>
      </ConfirmDialog>
    </>
  );
}

function ServiceReviewsPanel() {
  return (
    <ReviewsPanel
      heading="Service Reviews"
      query={useAllReviews()}
      approveMutation={useApproveReview()}
      deleteMutation={useDeleteReview()}
      searchFields={(r) => [r.name, r.service, r.review]}
      adapt={(r) => ({
        author: r.name,
        initial: (r.name || "?").charAt(0).toUpperCase(),
        body: r.review,
        tag: (
          <Badge tone={null} className={SERVICE_COLORS[r.service] || "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300"}>
            {r.service}
          </Badge>
        ),
      })}
      copy={{
        searchLabel: "Search service reviews",
        placeholder: "Search by name, service or content…",
        emptyTitle: "No service reviews found",
        emptyBody: "Reviews submitted by clients will appear here for moderation.",
        deleteTitle: "Delete this review?",
        deleteBody: "It is removed permanently and disappears from the public site.",
      }}
    />
  );
}

function ProductReviewsPanel() {
  return (
    <ReviewsPanel
      heading="Product Reviews"
      query={useAllProductReviews()}
      approveMutation={useApproveProductReview()}
      deleteMutation={useDeleteProductReview()}
      searchFields={(r) => [r.userName, r.productName, r.comment]}
      adapt={(r) => ({
        author: r.userName,
        initial: (r.userName || "?").charAt(0).toUpperCase(),
        body: r.comment,
        tag: r.productName ? (
          <Link
            href={r.productSlug ? `/shop/${r.productSlug}` : "#"}
            className="rounded-full bg-violet-50 px-2.5 py-1 text-caption font-semibold text-violet-700 hover:underline dark:bg-violet-900/30 dark:text-violet-400"
          >
            {r.productName}
          </Link>
        ) : (
          <Badge tone="neutral">Unknown product</Badge>
        ),
      })}
      copy={{
        searchLabel: "Search product reviews",
        placeholder: "Search by product, reviewer or content…",
        emptyTitle: "No product reviews found",
        emptyBody: "Reviews left on product pages will appear here for moderation.",
        deleteTitle: "Delete this product review?",
        deleteBody: "It is removed permanently and disappears from the product page.",
      }}
    />
  );
}

const TABS = [
  { value: "service", label: "Service Reviews" },
  { value: "product", label: "Product Reviews" },
];

export default function AdminReviewsPage() {
  const { loading: authLoading } = useAuth();
  const [tab, setTab] = useState("service"); // service | product

  if (authLoading) return null;

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Reviews"
          description="Moderate customer feedback — service and product reviews."
        />

        <div role="tablist" aria-label="Review type" className="mb-6 flex w-fit gap-2">
          {TABS.map((t) => (
            <Button
              key={t.value}
              role="tab"
              id={`tab-${t.value}`}
              aria-selected={tab === t.value}
              aria-controls={`panel-${t.value}`}
              size="sm"
              variant={tab === t.value ? "primary" : "secondary"}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "service" ? <ServiceReviewsPanel /> : <ProductReviewsPanel />}
        </div>
      </div>
    </div>
  );
}
