import Card from "./Card";
import cx from "./cx";

/*
 * A titled section inside a settings-style page: icon chip, heading, optional
 * description, hairline rule, body.
 *
 * Two hand-rolled copies existed (dashboard/settings and admin/business-settings)
 * and had already drifted — one used `dark:bg-slate-900`, the other
 * `dark:bg-gray-900`, so the two settings pages sat on different dark surfaces.
 *
 * `iconColor` is a background utility for the chip (e.g. "bg-blue-500"); the
 * glyph is always white on it, so keep those fills at 500 or darker.
 */
export default function SectionCard({
  icon: Icon,
  title,
  description,
  iconColor = "bg-gray-800",
  className = "",
  children,
}) {
  return (
    <Card padding="none" className={cx("overflow-hidden", className)}>
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-slate-800">
        {Icon && (
          <span className={cx("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl", iconColor)}>
            <Icon size={16} aria-hidden="true" className="text-white" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-body-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
          {description && (
            <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">{description}</p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}
