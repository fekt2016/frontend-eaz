import cx from "./cx";

/*
 * Table shell. The wrapper owns the horizontal scroll so wide tables never push
 * the page body sideways on mobile — the audit found 15 tables against 19
 * overflow-x-auto wrappers, i.e. coverage that had to be checked per-file.
 */
export function TableWrap({ className = "", children }) {
  return (
    <div className={cx("w-full overflow-x-auto", className)}>{children}</div>
  );
}

export function Table({ className = "", children, ...props }) {
  return (
    <table className={cx("w-full text-left border-collapse", className)} {...props}>
      {children}
    </table>
  );
}

export function Th({ className = "", children, ...props }) {
  return (
    <th
      scope="col"
      className={cx(
        "px-4 py-3 font-mono text-eyebrow font-bold uppercase",
        "text-gray-600 dark:text-slate-400",
        "border-b border-gray-200 dark:border-slate-800 whitespace-nowrap",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ className = "", children, ...props }) {
  return (
    <td
      className={cx(
        "px-4 py-3 text-body-sm text-gray-700 dark:text-slate-300",
        "border-b border-gray-100 dark:border-slate-800/70",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

export default Table;
