// Badge/background classes per repair-job status. Shared by the job-detail page
// (status banner) and the JobInvoice component.
export const STATUS_COLORS = {
  received:          "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  diagnosing:        "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  waiting_for_parts: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  repairing:         "bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/30",
  ready:             "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  collected:         "bg-gray-500/15 text-gray-500 dark:text-gray-400 border-gray-500/30",
  cancelled:         "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

// Human-readable label per status — mainly for `waiting_for_parts`, whose
// snake_case doesn't read well through a plain capitalize-first-letter/CSS
// `capitalize` transform. Matches the copy already used on the public
// track/[token] page for the same status.
export const STATUS_LABELS = {
  waiting_for_parts: "Waiting for Parts",
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || (status.charAt(0).toUpperCase() + status.slice(1));
}
