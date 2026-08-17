// Lightweight report table with horizontal scroll + skeleton loading rows.
// `columns` = [{ header, render: (row) => node, className }]. `rows` is the data.
export default function DataTable({ columns, rows, loading = false, loadingRows = 4, emptyText = "No data available for this period.", rowKey = "_id", maxHeight }) {
  return (
    <div className="overflow-x-auto" style={maxHeight ? { maxHeight } : undefined}>
      <table className="w-full text-left text-sm min-w-[560px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
            {columns.map((c, i) => (
              <th key={i} className={`px-4 py-3 font-semibold whitespace-nowrap ${c.className || ""}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                {columns.map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row?.[rowKey] ?? i} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-paper dark:hover:bg-gray-800/50 transition">
                {columns.map((c, j) => (
                  <td key={j} className={`px-4 py-3 ${c.className || ""}`}>
                    {c.render ? c.render(row) : row?.[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
