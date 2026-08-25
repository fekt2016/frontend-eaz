import { CheckCircle2, XCircle, Info, TriangleAlert } from "lucide-react";
import cx from "./cx";

/*
 * Inline status message for form results and page-level notices.
 *
 * Replaces per-page `Alert` copies (and several bare
 * `<p className="text-red-500">`) that announced nothing: without role="alert"
 * a screen reader never hears that a save failed. Every tone here is a measured
 * semantic token, so it reads in both themes.
 */
const tones = {
  success: {
    icon: CheckCircle2,
    cls: "border-success/20 bg-success-surface text-success dark:border-success-dark/30 dark:bg-success-surface-dark dark:text-success-dark",
  },
  error: {
    icon: XCircle,
    cls: "border-error/20 bg-error-surface text-error dark:border-error-dark/30 dark:bg-error-surface-dark dark:text-error-dark",
  },
  warning: {
    icon: TriangleAlert,
    cls: "border-warning/20 bg-warning-surface text-warning dark:border-warning-dark/30 dark:bg-warning-surface-dark dark:text-warning-dark",
  },
  info: {
    icon: Info,
    cls: "border-info/20 bg-info-surface text-info dark:border-info-dark/30 dark:bg-info-surface-dark dark:text-info-dark",
  },
};

export default function Alert({ tone = "info", children, className = "" }) {
  if (!children) return null;
  const { icon: Icon, cls } = tones[tone] || tones.info;
  return (
    <div
      // Errors interrupt; everything else is announced politely.
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "flex items-start gap-2 rounded-xl border px-4 py-3 text-body-sm font-medium",
        cls,
        className
      )}
    >
      <Icon size={16} aria-hidden="true" className="mt-0.5 flex-shrink-0" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}
