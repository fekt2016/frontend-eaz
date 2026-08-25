import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, Link2, Loader2, Printer } from "lucide-react";

/**
 * Job-detail page header: back link, job number + urgency, and the
 * Track-link / Print / Save actions. Presentational — the caller owns the
 * handlers and the `linkCopied` / `saving` flags.
 */
export function JobHeader({ job, linkCopied, saving, onCopyLink, onPrint, onSave }) {
  return (
    <div className="flex items-start justify-between print:hidden">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/pos/jobs" className="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
          <ArrowLeft size={12} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{job.jobNumber}</h1>
            {job.priority === "urgent" && (
              <span className="flex items-center gap-1 text-xs text-error dark:text-error-dark bg-error-surface border border-error/20 dark:bg-error-surface-dark dark:border-error-dark/30 px-2 py-0.5 rounded-full">
                <AlertTriangle size={9} /> Urgent
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Created {new Date(job.createdAt).toLocaleDateString("en-GH", { dateStyle: "long" })}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCopyLink} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm transition ${
          linkCopied
            ? "border-success/40 text-success dark:text-success-dark"
            : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700"
        }`}>
          {linkCopied ? <Check size={11} /> : <Link2 size={11} />}
          {linkCopied ? "Copied!" : "Track Link"}
        </button>
        <button onClick={onPrint} className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700 text-sm transition">
          <Printer size={12} /> Print
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-gray-900 text-sm font-semibold transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
          Save
        </button>
      </div>
    </div>
  );
}
