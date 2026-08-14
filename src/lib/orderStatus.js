export const STATUS_STYLES = {
  pending: { label: "Pending Payment", classes: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400" },
  paid: { label: "Paid", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  processing: { label: "Processing", classes: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
  shipped: { label: "Shipped", classes: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400" },
  delivered: { label: "Delivered", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  cancelled: { label: "Cancelled", classes: "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400" },
};

export function statusBadge(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.pending;
}