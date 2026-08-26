import cx from "./cx";

/*
 * Loading placeholder. The audit found spinners in 53 files vs skeletons in 25
 * — the same kind of content loading two different ways. Skeleton is the
 * default for anything with known shape (lists, cards, tables); reserve the
 * spinner for indeterminate in-place actions like a submitting button.
 *
 * animate-pulse is kept (it is already the codebase's idiom) and the global
 * prefers-reduced-motion block stills it.
 */
export default function Skeleton({ className = "", ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cx("animate-pulse rounded-lg bg-gray-200 dark:bg-slate-800", className)}
      {...props}
    />
  );
}

/** A block of text lines — the most common skeleton shape in this app. */
export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={cx("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cx("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
