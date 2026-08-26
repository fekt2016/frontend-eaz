import { formatGhs } from "@/lib/shop";

/**
 * Read-only summary of the job's customer, device, fault and warranty.
 * Presentational — takes the loaded `job` and renders; owns no state.
 */
export function CustomerDeviceCard({ job }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 print:border print:rounded-none">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{job.customer?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{job.customer?.phone}</p>
          {job.customer?.email && <p className="text-sm text-gray-500 dark:text-gray-400">{job.customer.email}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Device</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{[job.deviceBrand, job.deviceModel].filter(Boolean).join(" ") || "—"}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{job.deviceType}</p>
          {job.imei  && <p className="text-xs text-gray-500 mt-1">IMEI: {job.imei}</p>}
          {job.color && <p className="text-xs text-gray-500">Color: {job.color}</p>}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fault</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">{job.faultDescription}</p>
        {job.dropoff && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
            <div>
              <p className="text-xs font-semibold text-brand-ink dark:text-brand-400">
                {job.status !== "received"
                  ? "Device received"
                  : job.dropoff === "rider" ? "Rider pickup requested" : "Customer will bring device in"}
              </p>
              {job.dropoff === "rider" && job.pickupAddress && (
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{job.pickupAddress}</p>
              )}
            </div>
          </div>
        )}
        {job.requiresDiagnosis && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <span className="text-xs text-brand-ink dark:text-brand-400 font-medium">Diagnosis required</span>
            <span className="text-xs text-gray-600 dark:text-slate-400">· {formatGhs(job.diagnosisFee || 0)} charged upfront</span>
          </div>
        )}
        {job.repairWork && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Repair work</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{job.repairWork}</p>
          </div>
        )}
        {job.estimatedCompletion && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <span className="text-xs text-info dark:text-info-dark font-medium">Est. completion:</span>
            <span className="text-xs text-gray-600 dark:text-slate-400">
              {new Date(job.estimatedCompletion).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>
        )}
        {job.warrantyDays > 0 && (
          <div className={`mt-3 flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
            job.warrantyStatus === "active"        ? "bg-success-surface border-success/20 text-success dark:bg-success-surface-dark dark:border-success-dark/30 dark:text-success-dark" :
            job.warrantyStatus === "expiring_soon" ? "bg-brand-500/10 border-brand-500/20 text-brand-ink dark:text-brand-400" :
            job.warrantyStatus === "expired"       ? "bg-gray-500/10 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400" :
            "bg-teal-500/10 border-teal-500/20 text-teal-400"
          }`}>
            <span className="font-medium">
              🛡 Warranty: {job.warrantyDays} day{job.warrantyDays !== 1 ? "s" : ""}
              {job.warrantyNotes ? ` — ${job.warrantyNotes}` : ""}
            </span>
            {job.warrantyExpires && (
              <span>
                {job.warrantyStatus === "expired"
                  ? "Expired"
                  : `Exp. ${new Date(job.warrantyExpires).toLocaleDateString("en-GH")}`}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
