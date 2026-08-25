/*
 * Kept as a re-export so the job-detail page and JobInvoice keep their existing
 * import path. The map itself now lives in lib/jobStatus.js, shared with the
 * POS overview, the jobs list and PosOverview — see the note there.
 */
export {
  STATUS_TONES,
  STATUS_EXTRA,
  STATUS_LABELS,
  statusBadgeProps,
  statusBannerClass,
  statusLabel,
} from "@/lib/jobStatus";
