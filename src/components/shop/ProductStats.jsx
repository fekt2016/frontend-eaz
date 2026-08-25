import { Eye, ShoppingBag } from "lucide-react";
import { formatCount } from "@/lib/shop";

// Popularity line for a product card (T48): how many people have looked at the
// product and how many units have sold, both straight from the API — nothing is
// counted client-side.
//
// The view count shows whenever the API reports one, zero included — a product
// nobody has opened yet honestly reads "0 views". `sold` is held to a higher bar
// and only appears once there is a sale, because "0 sold" on a card reads as a
// verdict on the product rather than as information.
//
// Absent is not the same as zero: a product served by an API that predates these
// counters (or a retail part, which has no view tracking at all) renders nothing.
export default function ProductStats({ views, sold, className = "" }) {
  const showViews = views != null && Number.isFinite(Number(views));
  const showSold = Number(sold) > 0;
  if (!showViews && !showSold) return null;

  return (
    <div
      className={`flex items-center gap-3 text-[11px] text-gray-400 dark:text-slate-500 ${className}`}
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
