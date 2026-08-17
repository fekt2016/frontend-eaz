import { ArrowUp, ArrowDown } from "lucide-react";

const TONES = {
  brand:  "text-brand-600 dark:text-brand-400",
  green:  "text-emerald-600 dark:text-emerald-400",
  red:    "text-red-600 dark:text-red-400",
  blue:   "text-blue-600 dark:text-blue-400",
  purple: "text-purple-600 dark:text-purple-400",
  gray:   "text-gray-500 dark:text-gray-400",
};

// KPI stat card. `value` is display-ready (already GH₵ / formatted). `delta`
// is an object { value: number, label: string } — pass null to hide the
// comparison entirely (no fake percentages ever rendered).
export default function KpiCard({ label, value, icon: Icon, tone = "brand", sub, delta }) {
  const hasDelta = delta && typeof delta.value === "number";
  const up = hasDelta ? delta.value >= 0 : false;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
        {Icon && (
          <span className={`w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 ${TONES[tone] || TONES.brand}`}>
            <Icon size={14} />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight break-words">{value ?? "—"}</p>
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        {hasDelta && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
            up
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
          }`}>
            {up ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
            {Math.abs(delta.value).toLocaleString()}%
          </span>
        )}
        {sub && <span className="text-xs text-gray-500 dark:text-gray-400">{sub}</span>}
      </div>
    </div>
  );
}
