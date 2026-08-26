import cx from "./cx";

/*
 * An empty screen is an invitation to act, so this always wants an action.
 * `title` says what is not here; `description` says how to change that.
 */
export default function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <div className={cx("text-center py-14 px-6", className)}>
      {Icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
          <Icon size={22} aria-hidden="true" className="text-gray-600 dark:text-slate-400" />
        </div>
      )}
      <p className="font-display font-bold text-lg text-gray-900 dark:text-white">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-body-sm text-gray-600 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
