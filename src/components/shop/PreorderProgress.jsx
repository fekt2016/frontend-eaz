import { Factory, Ship, MapPin, Store, Check } from "lucide-react";

/**
 * T45 — where a customer's pre-ordered item actually is.
 *
 * Four steps, not the eight staff work with: "at origin port" and "in transit"
 * are the same news to someone waiting. Nothing identifying the supplier, the
 * container or an internal note reaches this component — the API does not send it.
 */
const STEPS = [
  { key: "preparing",  label: "Preparing",      icon: Factory, blurb: "Being prepared with our supplier" },
  { key: "on_the_way", label: "On its way",     icon: Ship,    blurb: "Shipped and in transit" },
  { key: "in_ghana",   label: "Arrived in Ghana", icon: MapPin, blurb: "Landed and clearing customs" },
  { key: "at_shop",    label: "At our shop",    icon: Store,   blurb: "With us — preparing your order" },
];

function fmtDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function PreorderProgress({ preorder }) {
  if (!preorder) return null;

  // Before a batch is assigned there is no position to show — say that plainly
  // rather than implying movement that has not happened.
  const currentIndex = STEPS.findIndex((s) => s.key === preorder.stage);
  const expected = fmtDate(preorder.expectedArrival);

  return (
    <div className="mt-5 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/60 dark:bg-blue-500/10 p-4">
      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
        Pre-order
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">
        {preorder.label}
      </p>
      {expected && (
        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
          Expected in Ghana around {expected}
        </p>
      )}

      {currentIndex >= 0 && (
        <ol className="mt-4 space-y-3">
          {STEPS.map((step, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            const Icon = step.icon;
            return (
              <li key={step.key} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                    done
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : active
                        ? "bg-blue-100 text-blue-700 ring-2 ring-blue-500 dark:bg-blue-500/20 dark:text-blue-300"
                        : "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-600"
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
                          : "text-gray-400 dark:text-slate-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  {active && (
                    <p className="text-xs text-gray-500 dark:text-slate-400">{step.blurb}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {preorder.items?.length > 0 && (
        <p className="mt-4 border-t border-blue-200/60 dark:border-blue-500/20 pt-3 text-xs text-gray-500 dark:text-slate-400">
          {preorder.items.map((i) => `${i.name}${i.qty > 1 ? ` × ${i.qty}` : ""}`).join(", ")}
        </p>
      )}
    </div>
  );
}
