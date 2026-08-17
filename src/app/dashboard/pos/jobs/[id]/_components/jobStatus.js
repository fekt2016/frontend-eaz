// Badge/background classes per repair-job status. Shared by the job-detail page
// (status banner) and the JobInvoice component.
export const STATUS_COLORS = {
  received:   "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  diagnosing: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  repairing:  "bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/30",
  ready:      "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  collected:  "bg-gray-500/15 text-gray-500 dark:text-gray-400 border-gray-500/30",
  cancelled:  "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};
