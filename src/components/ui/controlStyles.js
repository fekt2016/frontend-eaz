/*
 * One input surface for the whole app.
 *
 * Replaces 21 independently-declared `const inputCls` strings that had drifted
 * into two dialects (public `px-4 py-3 … bg-white` vs dashboard
 * `px-3.5 py-2.5 … bg-gray-100`) with three different focus treatments between
 * them. Focus is intentionally left to the global :focus-visible ring in
 * globals.css — so, unlike the strings this replaces, none of these set
 * `focus:outline-none`.
 */
export const controlBase =
  "w-full rounded-xl border bg-white text-gray-900 " +
  "placeholder-gray-500 transition-colors duration-150 " +
  "dark:bg-slate-800 dark:text-white dark:placeholder-slate-400 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

export const controlSizes = {
  sm: "px-3 py-2 text-body-sm min-h-[36px]",
  md: "px-4 py-2.5 text-body-sm min-h-[44px]",
  lg: "px-4 py-3 text-body min-h-[48px]",
};

export function controlBorder(hasError) {
  return hasError
    ? "border-error dark:border-error-dark"
    : "border-gray-300 hover:border-gray-400 dark:border-slate-700 dark:hover:border-slate-600";
}
