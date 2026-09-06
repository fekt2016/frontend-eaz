import { Ship } from "lucide-react";

/**
 * T45 — the batch's INTERNAL journey, for staff.
 *
 * The eight operational stages with their notes, their dates and who entered
 * them — not the four-stage collapse a customer sees. Both are shown per row on
 * purpose: someone answering "where is my phone?" needs to know what the
 * customer was actually told, which is rarely the words staff typed.
 *
 * Staff-only by construction — no customer-facing endpoint returns this shape,
 * so there is nothing here to hide behind a role check.
 */
function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function BatchHistory({ entries = [], emptyHint = "" }) {
  if (!entries.length) {
    return (
      <p className="text-xs text-gray-600 dark:text-slate-400">
        {emptyHint || "No movement recorded yet."}
      </p>
    );
  }

  return (
    <ol className="relative ml-2 space-y-3 border-l border-gray-200 dark:border-slate-700">
      {entries.map((e, i) => (
        <li key={`${e.stage}-${i}`} className="ml-4">
          <span
            aria-hidden="true"
            className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${
              i === entries.length - 1 ? "bg-brand-500" : "bg-gray-300 dark:bg-slate-600"
            }`}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-xs font-semibold text-gray-900 dark:text-white">{e.label}</p>
            <span className="text-xs text-gray-600 dark:text-slate-400">{fmtDate(e.date)}</span>
          </div>
          {e.customerLabel && (
            <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
              <Ship size={10} aria-hidden="true" className="mr-1 inline" />
              Customer sees: {e.customerLabel}
            </p>
          )}
          {e.note && (
            <p className="mt-0.5 text-xs italic text-gray-700 dark:text-slate-300">
              &ldquo;{e.note}&rdquo;
              {e.updatedBy ? ` — ${e.updatedBy}` : ""}
            </p>
          )}
          {!e.note && e.updatedBy && (
            <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">by {e.updatedBy}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
