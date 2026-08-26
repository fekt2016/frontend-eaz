import { statusBadgeProps, statusLabel } from "./jobStatus";
import { Badge } from "@/components/ui";
import { formatGhs } from "@/lib/shop";

/**
 * Invoice card: repair-work summary, parts breakdown, totals, and a
 * staff-only profit breakdown. Presentational — every amount arrives as integer
 * pesewas (T43) and renders through `formatGhs`, the single money formatter.
 * `diagnosisFee` and `laborCost` are the exception: they are the caller's edit-box
 * state, still cedis strings, so they are converted on the way in below.
 */
export function JobInvoice({
  status, repairWork, job, selectedParts,
  diagnosisFee, laborCost, totalParts, totalAmount, totalPaid, balanceDue,
  isTechnician, totalPartsCost, grossProfit, marginPct,
}) {
  const diagnosisFeePesewas = Math.round((Number(diagnosisFee) || 0) * 100);
  const laborCostPesewas    = Math.round((Number(laborCost) || 0) * 100);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/50 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Invoice</p>
        <Badge {...statusBadgeProps(status)}>{statusLabel(status)}</Badge>
      </div>

      {/* Repair work description — what teller tells the customer */}
      {(repairWork || job?.repairWork) && (
        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-brand-500/5">
          <p className="text-xs text-brand-ink dark:text-brand-400 font-medium mb-1">Repair work</p>
          <p className="text-sm text-gray-700 dark:text-gray-200">{repairWork || job?.repairWork}</p>
        </div>
      )}

      {/* Parts breakdown */}
      {selectedParts.length > 0 && (
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 space-y-1.5">
          <p className="text-xs text-gray-500 font-medium mb-2">Parts</p>
          {selectedParts.map(p => (
            <div key={p.id} className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">{p.name} × {p.quantity}</span>
              <span className="text-gray-900 dark:text-white">{formatGhs((p.cost || 0) * p.quantity)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="px-5 py-4 space-y-2.5">
        {job?.requiresDiagnosis && (
          <div className="flex justify-between text-sm">
            <span className="text-brand-ink dark:text-brand-400 flex items-center gap-1.5">
              Diagnosis fee
              <span className="text-xs bg-purple-500/15 border border-purple-500/20 px-1.5 py-0.5 rounded-full">upfront</span>
            </span>
            <span className="text-gray-900 dark:text-white">{formatGhs(diagnosisFeePesewas)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Parts</span>
          <span className="text-gray-900 dark:text-white">{formatGhs(totalParts)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Labour</span>
          <span className="text-gray-900 dark:text-white">{formatGhs(laborCostPesewas)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold border-t border-gray-200 dark:border-gray-800 pt-2.5">
          <span className="text-gray-600 dark:text-gray-300">Total</span>
          <span className="text-gray-900 dark:text-white">{formatGhs(totalAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Paid</span>
          <span className="text-success dark:text-success-dark">{formatGhs(totalPaid)}</span>
        </div>
        <div className={`flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-800 pt-2.5 ${balanceDue > 0 ? "text-error dark:text-error-dark" : "text-success dark:text-success-dark"}`}>
          <span>Balance due</span>
          <span>{formatGhs(balanceDue)}</span>
        </div>

        {/* Profit margin — staff/superadmin only */}
        {!isTechnician && totalAmount > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Profit Breakdown</p>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Parts cost</span>
              <span className="text-gray-500 dark:text-gray-400">{formatGhs(totalPartsCost)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Revenue</span>
              <span className="text-gray-600 dark:text-gray-300">{formatGhs(totalAmount)}</span>
            </div>
            <div className={`flex justify-between text-sm font-bold pt-1 ${grossProfit >= 0 ? "text-success dark:text-success-dark" : "text-error dark:text-error-dark"}`}>
              <span>Gross Profit</span>
              <span>{formatGhs(grossProfit)} ({marginPct}%)</span>
            </div>
            {/* Visual margin bar */}
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all ${marginPct >= 50 ? "bg-green-500" : marginPct >= 25 ? "bg-brand-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(100, Math.max(0, marginPct))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
