import Skeleton, { SkeletonText } from "@/components/ui/Skeleton";

export default function BlogLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 pt-28 pb-20">
      <span className="sr-only-text" role="status">Loading articles</span>
      <Skeleton className="h-8 w-40 mb-3" />
      <Skeleton className="h-4 w-72 mb-10" />
      <div className="space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-5">
            <Skeleton className="h-24 w-32 flex-shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-4 w-2/3" />
              <SkeletonText lines={2} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
