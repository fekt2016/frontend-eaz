import { Eye, ShoppingBag } from "lucide-react";
import { formatCount } from "@/lib/shop";

// Popularity line for a product card (T48): how many people have looked at the
// product and how many units have sold, both straight from the API — nothing is
// counted client-side.
//
// A stat appears only once it has something to say. A brand-new product, or one
// served by an API that predates these counters, renders nothing at all rather
// than a wall of "0 views · 0 sold".
export default function ProductStats({ views, sold, className = "" }) {
  const showViews = Number(views) > 0;
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
