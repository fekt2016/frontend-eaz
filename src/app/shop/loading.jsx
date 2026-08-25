import Skeleton from "@/components/ui/Skeleton";

/*
 * Route-level loading state for the shop.
 *
 * The app previously had a single loading.jsx at the root — a centred spinner
 * that replaced the whole screen for all 87 routes. A skeleton in the shape of
 * the grid that is about to arrive tells the user what is coming and stops the
 * layout jumping when it does.
 */
export default function ShopLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-28 pb-20">
      <span className="sr-only-text" role="status">Loading products</span>
      <Skeleton className="h-8 w-52 mb-3" />
      <Skeleton className="h-4 w-80 mb-10" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
            <Skeleton className="aspect-square rounded-none" />
            <div className="p-4 space-y-2.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-4 w-1/3 mt-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
