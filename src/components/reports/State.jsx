import { FaExclamationTriangle, FaInbox } from "react-icons/fa";

// Clear error state — never collapses into zeroes when the request failed.
export function ErrorState({ title = "Unable to load report", message, onRetry }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-900/50 p-8 text-center">
      <div className="w-10 h-10 mx-auto rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-3">
        <FaExclamationTriangle size={16} className="text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
      {message && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// Honest empty state for a genuinely data-less period.
export function EmptyState({ title = "No data", message }) {
  return (
    <div className="py-10 text-center">
      <div className="w-10 h-10 mx-auto rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
        <FaInbox size={16} className="text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</p>
      {message && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">{message}</p>}
    </div>
  );
}

// Skeleton blocks — shown while a report is loading so we never flash GH₵0.
export function KpiSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-32 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse" />
      ))}
    </div>
  );
}

export function ChartSkeleton({ className = "" }) {
  return <div className={`h-56 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse ${className}`} />;
}

export function CardSkeleton({ className = "" }) {
  return <div className={`h-64 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse ${className}`} />;
}
