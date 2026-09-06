import { Factory, Warehouse, Ship, Anchor, Store, Check } from "lucide-react";

/**
 * T45 — where a customer's pre-ordered item actually is.
 *
 * Five steps, not the eight staff work with: "ordered" and "in production" are
 * the same news to someone waiting, and so are "landed" and "clearing customs".
 * Nothing identifying the supplier, the container or an internal note reaches
 * this component — the API does not send it.
 *
 * The road ends at our warehouse. Releasing the pre-order there is what starts
 * the ordinary local delivery tracking, which is a different journey.
 *
 * The journey starts abroad, so the whole road is drawn from the moment the
 * order is placed — including before a batch is assigned, where every step is
 * still pending. Drawing the road claims no progress; it answers "where is my
 * money going" for someone who just paid in full for something not yet made.
 */
const STEPS = [
  { key: "production",          label: "In production",           icon: Factory,   blurb: "Being made by our supplier" },
  { key: "container_warehouse", label: "At the container warehouse", icon: Warehouse, blurb: "Made, and waiting for a container" },
  { key: "shipped",             label: "Shipped",                 icon: Ship,      blurb: "On the water, heading for Ghana" },
  { key: "port_ghana",          label: "Arrived at the port in Ghana", icon: Anchor, blurb: "Landed and clearing customs" },
  { key: "at_shop",             label: "At our warehouse",        icon: Store,     blurb: "With us — preparing your order" },
];

function fmtDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function PreorderProgress({ preorder }) {
  if (!preorder) return null;

  // -1 before a batch is assigned: no step is done or active, and the road below
  // renders entirely pending rather than implying movement that has not happened.
  const currentIndex = STEPS.findIndex((s) => s.key === preorder.stage);
  const expected = fmtDate(preorder.expectedArrival);
  const origin = preorder.origin || "";
  // When each stage was actually reached, keyed for lookup against the steps.
  const dates = new Map((preorder.history || []).map((h) => [h.stage, h.date]));

  return (
    <div className="mt-5 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/60 dark:bg-blue-500/10 p-4">
      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
        Pre-order
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {preorder.label}
      </p>
      {origin && currentIndex < 3 && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
          Coming from {origin}
        </p>
      )}
      {expected && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
          Expected in Ghana around {expected}
        </p>
      )}

      <ol className="mt-4 space-y-3">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const reached = fmtDate(dates.get(step.key));
          const Icon = step.icon;
          return (
            <li key={step.key} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                  done
                    ? "bg-blue-600 text-white dark:bg-blue-500"
                    : active
                      ? "bg-blue-100 text-blue-700 ring-2 ring-blue-500 dark:bg-blue-500/20 dark:text-blue-300"
                      : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-600"
                }`}
              >
                {done ? <Check size={12} aria-hidden="true" /> : <Icon size={12} aria-hidden="true" />}
              </span>
              <div>
                <p
                  className={`text-sm ${
                    active
                      ? "font-semibold text-gray-900 dark:text-white"
                      : done
                        ? "text-gray-600 dark:text-slate-300"
                        : "text-gray-600 dark:text-slate-500"
                  }`}
                >
                  {step.label}
                </p>
                {active && (
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {step.blurb}
                    {step.key === "production" && origin ? ` in ${origin}` : ""}
                  </p>
                )}
                {reached && (
                  <p className="text-xs text-gray-500 dark:text-slate-500">{reached}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {preorder.items?.length > 0 && (
        <p className="mt-4 border-t border-blue-200/60 dark:border-blue-500/20 pt-3 text-xs text-gray-500 dark:text-slate-400">
          {preorder.items.map((i) => `${i.name}${i.qty > 1 ? ` × ${i.qty}` : ""}`).join(", ")}
        </p>
      )}
    </div>
  );
}
