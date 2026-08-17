import Link from "next/link";
import { FaArrowLeft, FaExclamationTriangle, FaLink, FaCheck, FaPrint, FaSpinner } from "react-icons/fa";

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
          <FaArrowLeft size={12} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{job.jobNumber}</h1>
            {job.priority === "urgent" && (
              <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                <FaExclamationTriangle size={9} /> Urgent
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Created {new Date(job.createdAt).toLocaleDateString("en-GH", { dateStyle: "long" })}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCopyLink} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm transition ${
          linkCopied
            ? "border-green-500/50 text-green-600 dark:text-green-400"
            : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700"
        }`}>
          {linkCopied ? <FaCheck size={11} /> : <FaLink size={11} />}
          {linkCopied ? "Copied!" : "Track Link"}
        </button>
        <button onClick={onPrint} className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700 text-sm transition">
          <FaPrint size={12} /> Print
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition disabled:opacity-50"
        >
          {saving ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />}
          Save
        </button>
      </div>
    </div>
  );
}
