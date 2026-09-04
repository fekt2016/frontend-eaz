/*
 * Pre-order marking, shared by the customer's order list and the staff one.
 *
 * The release queue used to be a page of its own. It was the same order rows
 * plus one button, and as a second implementation of "list orders" it had
 * drifted — no search, no pagination, against an endpoint capped at 10, so with
 * twelve people waiting two were invisible and nothing said so. It is a filter
 * and a sort, so it is one now.
 */

/** Waiting on stock, already sent out, or not a pre-order at all. */
export function preorderState(order) {
  const lines = (order?.items || []).filter((i) => i.isPreorder);
  if (!lines.length) return null;
  // Only the waiting state is actionable, so the two must not share a badge.
  return lines.some((i) => !i.preorderReleasedAt) ? "pending" : "released";
}

export function PreorderBadge({ state }) {
  if (!state) return null;
  const pending = state === "pending";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        pending
          ? "bg-warning-surface dark:bg-warning-surface-dark text-warning dark:text-warning-dark"
          : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
      }`}
    >
      {pending ? "Pre-order" : "Pre-order released"}
    </span>
  );
}
