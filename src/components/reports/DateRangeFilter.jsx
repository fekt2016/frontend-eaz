"use client";

import { useState } from "react";
import { FaSync, FaCalendarAlt } from "react-icons/fa";

const PRESETS = [
  { label: "Today",         compute: (now) => { const f = new Date(now); return { from: f, to: new Date(f) }; } },
  { label: "Yesterday",     compute: (now) => { const t = new Date(now); t.setDate(t.getDate() - 1); return { from: t, to: new Date(t) }; } },
  { label: "Last 7 Days",   compute: (now) => { const f = new Date(now); f.setDate(f.getDate() - 7); return { from: f, to: now }; } },
  { label: "Last 30 Days",  compute: (now) => { const f = new Date(now); f.setDate(f.getDate() - 30); return { from: f, to: now }; } },
  { label: "This Month",    compute: (now) => { const f = new Date(now.getFullYear(), now.getMonth(), 1); return { from: f, to: now }; } },
  { label: "Last Month",    compute: (now) => { const f = new Date(now.getFullYear(), now.getMonth() - 1, 1); const t = new Date(now.getFullYear(), now.getMonth(), 0); return { from: f, to: t }; } },
  { label: "This Year",     compute: (now) => { const f = new Date(now.getFullYear(), 0, 1); return { from: f, to: now }; } },
];

const CUSTOM = "Custom Range";

// Consistent with the existing reports page: dates are YYYY-MM-DD strings.
// Ghana is UTC+0 (no DST), so toISOString().slice(0,10) equals the local date.
function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

export default function DateRangeFilter({ from, to, onChange, onRefresh, refreshing }) {
  const initial = PRESETS.find(
    (p) => p.label !== CUSTOM && from === toDateStr(p.compute(new Date()).from) && to === toDateStr(p.compute(new Date()).to),
  )?.label;
  const [active, setActive] = useState(initial || CUSTOM);

  const applyPreset = (label) => {
    const p = PRESETS.find((x) => x.label === label);
    if (!p) return;
    const { from: f, to: t } = p.compute(new Date());
    setActive(label);
    onChange(toDateStr(f), toDateStr(t));
  };

  const applyCustom = (which, value) => {
    setActive(CUSTOM);
    if (which === "from") onChange(value, to);
    else onChange(from, value);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.label)}
            aria-pressed={active === p.label}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              active === p.label
                ? "bg-brand-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}

        <div className="flex items-center gap-2 ml-auto">
          <FaCalendarAlt size={12} className="text-gray-400 hidden sm:block" aria-hidden="true" />
          <label className="sr-only" htmlFor="reports-from">From date</label>
          <input
            id="reports-from"
            type="date"
            value={from}
            onChange={(e) => applyCustom("from", e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
          />
          <span className="text-gray-500 text-xs">to</span>
          <label className="sr-only" htmlFor="reports-to">To date</label>
          <input
            id="reports-to"
            type="date"
            value={to}
            onChange={(e) => applyCustom("to", e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
          />
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh reports"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:text-gray-900 dark:hover:text-white transition disabled:opacity-50"
          >
            <FaSync size={11} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
