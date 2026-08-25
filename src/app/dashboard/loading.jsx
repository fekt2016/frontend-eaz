import Skeleton from "@/components/ui/Skeleton";

/*
 * Sits inside DashboardShell, so it only fills the content region — the
 * sidebar and topbar stay put instead of the whole app flashing to a spinner.
 */
export default function DashboardLoading() {
  return (
    <div className="p-5 lg:p-7">
      <span className="sr-only-text" role="status">Loading</span>
      <Skeleton className="h-7 w-48 mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 dark:border-slate-800 p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 p-5 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
