// Stacked daily revenue chart (custom SVG — no chart dependency in the project).
// Each day stacks repair payments, over-the-counter POS sales and online shop
// order revenue, all in integer pesewas divided at the edge only. Scrolls
// horizontally for long ranges; tooltips via native <title>.
const COLORS = {
  repair: "#f59e0b",   // brand amber
  posSales: "#3b82f6", // blue
  shopOrders: "#10b981", // emerald
};

export function compactGhs(pesewas) {
  const cedis = (Number(pesewas) || 0) / 100;
  if (cedis >= 1_000_000) return `GH₵${(cedis / 1_000_000).toFixed(1)}M`;
  if (cedis >= 1_000) return `GH₵${(cedis / 1_000).toFixed(1)}k`;
  return `GH₵${Math.round(cedis)}`;
}

function niceCeil(v) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const n = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return n * mag;
}

function fmtLabel(dateStr) {
  if (!dateStr) return "";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-GH", { day: "numeric", month: "short" });
}

export default function RevenueChart({ series = [], labelStep }) {
  const n = series.length;
  if (n === 0) return null;

  const slot = n > 60 ? 12 : 22;
  const barW = Math.max(8, slot - 5);
  const padL = 46, padR = 8, padT = 14, padB = 28;
  const plotH = 190;
  const viewW = Math.max(series.length * slot + padL + padR, 540);
  const maxTotal = Math.max(...series.map((d) => d.total), 0);
  const maxY = niceCeil(maxTotal);
  const step = labelStep || Math.max(1, Math.ceil(n / 10));

  const gridlines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={viewW}
        height={padT + plotH + padB}
        viewBox={`0 0 ${viewW} ${padT + plotH + padB}`}
        role="img"
        aria-label="Daily revenue stacked by source"
      >
        {gridlines.map((g) => {
          const y = padT + plotH - g * plotH;
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={viewW - padR} y2={y} stroke="rgba(148,163,184,0.2)" strokeWidth={1} />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#9ca3af">
                {compactGhs(maxY * g)}
              </text>
            </g>
          );
        })}

        {series.map((d, i) => {
          const x = padL + i * slot;
          const h = (v) => (maxY > 0 ? (v / maxY) * plotH : 0);
          const segments = [
            { v: d.repair, color: COLORS.repair },
            { v: d.posSales, color: COLORS.posSales },
            { v: d.shopOrders, color: COLORS.shopOrders },
          ];
          let bottom = padT + plotH;
          return (
            <g key={`day-${i}`}>
              {segments.map((s, si) => {
                const hh = h(s.v);
                bottom -= hh;
                return (
                  <rect
                    key={`seg-${i}-${si}`}
                    x={x}
                    y={bottom}
                    width={barW}
                    height={Math.max(hh, 0)}
                    rx={si === 2 ? 2 : 0}
                    fill={s.color}
                  >
                    <title>{`${fmtLabel(d.date)} · ${s.v > 0 ? s.v / 100 : 0} GHS (${s.color === COLORS.repair ? "repairs" : s.color === COLORS.posSales ? "POS sales" : "shop orders"})`}</title>
                  </rect>
                );
              })}
            </g>
          );
        })}

        {series.map((d, i) => {
          if (i % step !== 0) return null;
          return (
            <text
              key={`l-${i}`}
              x={padL + i * slot + barW / 2}
              y={padT + plotH + 16}
              textAnchor="middle"
              fontSize={9}
              fill="#9ca3af"
            >
              {fmtLabel(d.date)}
            </text>
          );
        })}
      </svg>

      <div className="flex items-center gap-4 mt-2">
        <LegendItem color={COLORS.repair} label="Repairs" />
        <LegendItem color={COLORS.posSales} label="POS sales" />
        <LegendItem color={COLORS.shopOrders} label="Shop orders" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
