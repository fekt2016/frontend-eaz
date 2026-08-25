import cx from "./cx";

/*
 * Status pill. Uses the semantic tokens, whose light shades were picked to
 * clear 4.5:1 on both paper and white — the previous ad-hoc `text-emerald-600`
 * / `text-red-500` pills did not.
 */
const tones = {
  neutral: "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300",
  brand: "bg-brand-50 text-brand-ink dark:bg-brand-500/15 dark:text-brand-400",
  success: "bg-success-surface text-success dark:bg-success-surface-dark dark:text-success-dark",
  warning: "bg-warning-surface text-warning dark:bg-warning-surface-dark dark:text-warning-dark",
  error: "bg-error-surface text-error dark:bg-error-surface-dark dark:text-error-dark",
  info: "bg-info-surface text-info dark:bg-info-surface-dark dark:text-info-dark",
};

/*
 * `tone={null}` opts out of the tone map and applies geometry only. That escape
 * hatch exists for the activity log, whose 30-action taxonomy carries its own
 * colour map in lib/activityLog.js — flattening it onto six semantic tones
 * would cost the scannability the audit trail is for. Everything else should
 * use a named tone; passing raw colours through className would collide with
 * the tone classes, since Tailwind resolves ties by its own source order.
 */
export default function Badge({ tone = "neutral", className = "", children, ...props }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-semibold",
        tone === null ? "" : tones[tone] || tones.neutral,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
