// Shared card shell for report sections — matches the dashboard's rounded-2xl
// card language (bg-white / border-gray-200, dark:bg-gray-900 / dark:border-gray-800).
export default function Card({ title, subtitle, action, children, pad = true, className = "" }) {
  return (
    <section className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}>
      {(title || subtitle || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            {title && <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>}
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={pad ? "px-5 py-5" : ""}>{children}</div>
    </section>
  );
}
