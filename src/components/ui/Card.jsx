import cx from "./cx";

/*
 * The house card: white on light, slate-900 on dark, 2xl radius, hairline
 * border, no shadow by default. Matches the shape language already measured
 * across the codebase (343 rounded-2xl) rather than introducing a new one.
 */
export default function Card({ as: As = "div", padding = "md", interactive = false, className = "", children, ...props }) {
  const pad = { none: "", sm: "p-4", md: "p-5", lg: "p-6 sm:p-8" }[padding] ?? "p-5";
  return (
    <As
      className={cx(
        "rounded-2xl border bg-white border-gray-200 dark:bg-slate-900 dark:border-slate-800",
        pad,
        interactive &&
          "transition-colors duration-150 hover:border-gray-300 dark:hover:border-slate-700",
        className
      )}
      {...props}
    >
      {children}
    </As>
  );
}
