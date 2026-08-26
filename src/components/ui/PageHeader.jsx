import cx from "./cx";

/*
 * One <h1> per page, with a real name.
 *
 * DashboardShell renders `title` (default "Dashboard") as the desktop topbar
 * <h1>, but AppShellDecision never passed one — so Overview, Shop Orders, My
 * Repairs, Hosting, Domains, Notifications, Settings and all ten admin pages
 * announced themselves as "Dashboard", and any page that also rendered its own
 * heading produced two <h1>s. PageHeader gives each route a titled header, and
 * the shell topbar now reads the route's real name instead.
 */
export default function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  as: As = "h1",
  className = "",
}) {
  return (
    <div
      className={cx(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-2">
            {eyebrow}
          </p>
        )}
        <As className="font-display font-bold text-2xl text-gray-900 dark:text-white">
          {title}
        </As>
        {description && (
          <p className="mt-1.5 text-body-sm text-gray-600 dark:text-slate-400 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 sm:flex-shrink-0">{actions}</div>}
    </div>
  );
}
