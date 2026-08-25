import { ArrowUp, ArrowDown } from "lucide-react";
import { Badge, Card } from "@/components/ui";

/*
 * The accent applies to the icon only, so these stay decorative — none of them
 * carries meaning a colour-blind reader would lose. The old map used
 * emerald-600 (3.8:1) and gray-500 (4.0:1) as text on white; both failed AA.
 */
const TONES = {
  brand:  "text-brand-ink dark:text-brand-400",
  green:  "text-success dark:text-success-dark",
  red:    "text-error dark:text-error-dark",
  blue:   "text-info dark:text-info-dark",
  purple: "text-purple-700 dark:text-purple-400",
  gray:   "text-gray-600 dark:text-slate-400",
};

// KPI stat card. `value` is display-ready (already GH₵ / formatted). `delta`
// is an object { value: number, label: string } — pass null to hide the
// comparison entirely (no fake percentages ever rendered).
export default function KpiCard({ label, value, icon: Icon, tone = "brand", sub, delta }) {
  const hasDelta = delta && typeof delta.value === "number";
  const up = hasDelta ? delta.value >= 0 : false;

  return (
    <Card>
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="font-mono text-eyebrow font-bold uppercase text-gray-600 dark:text-slate-400">{label}</p>
        {Icon && (
          <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800 ${TONES[tone] || TONES.brand}`}>
            <Icon size={15} aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="break-words text-2xl font-bold leading-tight tabular-nums text-gray-900 dark:text-white">
        {value ?? "—"}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {hasDelta && (
          <Badge tone={up ? "success" : "error"}>
            {up ? <ArrowUp size={11} aria-hidden="true" /> : <ArrowDown size={11} aria-hidden="true" />}
            {Math.abs(delta.value).toLocaleString()}%
          </Badge>
        )}
        {sub && <span className="text-caption text-gray-600 dark:text-slate-400">{sub}</span>}
      </div>
    </Card>
  );
}
