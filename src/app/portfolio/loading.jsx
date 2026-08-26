import Skeleton from "@/components/ui/Skeleton";

export default function PortfolioLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-28 pb-20">
      <span className="sr-only-text" role="status">Loading work</span>
      <Skeleton className="h-8 w-48 mb-3" />
      <Skeleton className="h-4 w-80 mb-10" />
      <div className="grid sm:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
            <Skeleton className="aspect-[16/10] rounded-none" />
            <div className="p-5 space-y-2.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
