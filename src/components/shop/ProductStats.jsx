import { Eye, ShoppingBag } from "lucide-react";
import { formatCount } from "@/lib/shop";

// Popularity line for a product card (T48): how many people have looked at the
// product and how many units have sold, both straight from the API — nothing is
// counted client-side.
//
// Both counts show whenever the API reports them, zero included — a product
// nobody has opened yet reads "0 views · 0 sold", which is the honest figure.
//
// Absent is not the same as zero: a product served by an API that predates these
// counters (or a retail part, which has no tracking at all) renders nothing.
const present = (value) => value != null && Number.isFinite(Number(value));

export default function ProductStats({ views, sold, className = "" }) {
  const showViews = present(views);
  const showSold = present(sold);
  if (!showViews && !showSold) return null;

  return (
    <div
      className={`flex items-center gap-3 text-[11px] text-gray-600 dark:text-slate-500 ${className}`}
    >
      {showViews && (
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          {formatCount(views)} {Number(views) === 1 ? "view" : "views"}
        </span>
      )}
      {showSold && (
        <span className="inline-flex items-center gap-1">
          <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
          {formatCount(sold)} sold
        </span>
      )}
    </div>
  );
}
