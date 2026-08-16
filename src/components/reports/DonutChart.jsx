// Lightweight SVG donut chart (no chart library in the project). `data` is an
// array of { label, value, color }. Renders arcs + a legend with counts and
// percentages. Accessible: role="img" + aria-label summary, <title> tooltips.
export default function DonutChart({ data, total, size = 148, strokeWidth = 16, valueFormatter = (v) => String(v) }) {
  const safe = (data || []).filter((d) => d && Number(d.value) > 0);
  const grandTotal = total != null ? Number(total) : safe.reduce((s, d) => s + Number(d.value), 0);
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let acc = 0;
  const segments = safe.map((d) => {
    const frac = grandTotal > 0 ? Number(d.value) / grandTotal : 0;
    const seg = { ...d, frac, dash: frac * c, offset: -acc * c };
    acc += frac;
    return seg;
  });

  const summary = safe
    .map((d) => `${d.label}: ${valueFormatter(d.value)}`)
    .join(", ");

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          role="img"
          aria-label={summary ? `Chart: ${summary}` : "No chart data"}
        >
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={strokeWidth} />
          {segments.map((s) => (
            <circle
              key={s.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${s.dash} ${c - s.dash}`}
              strokeDashoffset={s.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            >
              <title>{`${s.label}: ${valueFormatter(s.value)}`}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{grandTotal}</p>
          <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mt-1">Total</p>
        </div>
      </div>

      {segments.length > 0 && (
        <ul className="flex-1 w-full min-w-0 space-y-2.5">
          {segments.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-300 capitalize truncate">
                  {s.label.replace(/_/g, " ")}
                </span>
              </span>
              <span className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-semibold text-gray-900 dark:text-white">{valueFormatter(s.value)}</span>
                <span className="text-[11px] text-gray-400 w-10 text-right">{Math.round(s.frac * 100)}%</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
