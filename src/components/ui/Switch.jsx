"use client";

import { useId } from "react";
import cx from "./cx";

/*
 * The one on/off toggle.
 *
 * Two existed before: business-settings had a correct one (role="switch",
 * aria-checked) and the blog editor had a bare <button> inside a <label> with
 * no control — so it announced nothing and clicking the label text did nothing.
 * This is the correct one, promoted.
 *
 * Give it either a visible `label` (rendered beside the track and clickable) or,
 * for a toggle whose meaning is already in the surrounding row, an `aria-label`.
 */
export default function Switch({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  tone = "brand",
  className = "",
  ...props
}) {
  const id = useId();
  const labelId = label ? `sw-${id}-label` : undefined;

  const onTrack = tone === "success"
    ? "bg-success dark:bg-success-dark"
    : "bg-brand-500";

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cx(
        "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-150",
        "disabled:cursor-not-allowed disabled:opacity-60",
        checked ? onTrack : "bg-gray-300 dark:bg-slate-700",
        !label && className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cx(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );

  if (!label) return control;

  return (
    <div className={cx("flex items-start gap-3", className)}>
      {control}
      <span className="min-w-0">
        {/* Clicking the text toggles too — the old blog markup only looked like it did. */}
        <span
          id={labelId}
          onClick={() => !disabled && onChange?.(!checked)}
          className="block cursor-pointer text-body-sm font-medium text-gray-700 dark:text-slate-300"
        >
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-caption text-gray-600 dark:text-slate-400">
            {description}
          </span>
        )}
      </span>
    </div>
  );
}
