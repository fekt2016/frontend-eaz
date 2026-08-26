/*
 * Repair-job status: one tone map and one label helper for the whole POS.
 *
 * Four copies of this existed — pos/page.jsx, pos/jobs/page.jsx,
 * components/pos/PosOverview.jsx and pos/jobs/[id]/_components/jobStatus.js —
 * and they had already drifted: `waiting_for_parts` was orange in two and amber
 * in a third, `repairing` was brand-ink in one and brand-600 in another, and
 * the jobs LIST omitted `waiting_for_parts` entirely, so those jobs fell
 * through to an unstyled grey chip.
 *
 * The colours are the measured semantic tones (see tailwind.config.js), which
 * the old `text-green-600 on bg-green-500/15` (3.4:1) and
 * `text-amber-600 on bg-amber-500/20` (2.6:1) pairs did not clear.
 */

/** Badge tone per status — pass straight to <Badge tone={…}>. */
export const STATUS_TONES = {
  received:          "info",
  diagnosing:        "diagnosing",  // purple — see STATUS_EXTRA below
  waiting_for_parts: "warning",
  repairing:         "brand",
  ready:             "success",
  collected:         "neutral",
  cancelled:         "error",
};

/*
 * `diagnosing` is the one status with no semantic equivalent — it is neither a
 * warning nor a success, and collapsing it into neutral would make it
 * indistinguishable from `collected` on a busy board. It keeps purple, applied
 * through Badge's tone={null} escape hatch.
 */
export const STATUS_EXTRA = {
  diagnosing: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

/** Everything a status chip needs: `{ tone, className }` for <Badge>. */
export function statusBadgeProps(status) {
  const extra = STATUS_EXTRA[status];
  if (extra) return { tone: null, className: extra };
  return { tone: STATUS_TONES[status] || "neutral" };
}

// Human-readable label per status — mainly for `waiting_for_parts`, whose
// snake_case doesn't read well through a plain capitalize-first-letter/CSS
// `capitalize` transform. Matches the copy already used on the public
// track/[token] page for the same status.
export const STATUS_LABELS = {
  waiting_for_parts: "Waiting for Parts",
};

export function statusLabel(status) {
  if (!status) return "—";
  return STATUS_LABELS[status] || (status.charAt(0).toUpperCase() + status.slice(1));
}

/*
 * The job-detail page uses the status as a full-width tinted banner rather than
 * a chip, so it needs surface + text together. Same semantics, larger surface.
 */
const BANNERS = {
  received:          "bg-info-surface text-info border-info/20 dark:bg-info-surface-dark dark:text-info-dark dark:border-info-dark/30",
  diagnosing:        "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/40",
  waiting_for_parts: "bg-warning-surface text-warning border-warning/20 dark:bg-warning-surface-dark dark:text-warning-dark dark:border-warning-dark/30",
  repairing:         "bg-brand-50 text-brand-ink border-brand-200 dark:bg-brand-900/20 dark:text-brand-400 dark:border-brand-800/40",
  ready:             "bg-success-surface text-success border-success/20 dark:bg-success-surface-dark dark:text-success-dark dark:border-success-dark/30",
  collected:         "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  cancelled:         "bg-error-surface text-error border-error/20 dark:bg-error-surface-dark dark:text-error-dark dark:border-error-dark/30",
};

export function statusBannerClass(status) {
  return BANNERS[status] || BANNERS.collected;
}

/** The statuses that mean a job is still on the bench. */
export const ACTIVE_STATUSES = ["received", "diagnosing", "waiting_for_parts", "repairing", "ready"];

/** Ordered list for filter tabs — every status the board can hold. */
export const ALL_STATUSES = [
  "received", "diagnosing", "waiting_for_parts", "repairing",
  "ready", "collected", "cancelled",
];
