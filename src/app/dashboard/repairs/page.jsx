"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fmtDate } from "@/components/dashboard/customer/CustomerCards";
import { useMyRepairs } from "@/hooks/queries/useRepairs";

const REPAIR_STATUS = {
  received:          { label: "Received",          cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  diagnosing:        { label: "Diagnosing",        cls: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  waiting_for_parts: { label: "Waiting for Parts", cls: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400" },
  repairing:         { label: "Repairing",         cls: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  ready:             { label: "Ready",             cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  collected:         { label: "Collected",         cls: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300" },
  cancelled:         { label: "Cancelled",         cls: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
};

export default function CustomerRepairsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: repairs = [], isLoading: loading } = useMyRepairs();

  const isStaff = ["superadmin", "admin", "staff", "technician"].includes(user?.role);

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900 dark:text-white">My Repairs</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Device repairs booked in-store, matched by your phone number.</p>
        </div>
        <Link href="/repair" className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition">
          Create a Repair Job
        </Link>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-gray-200 dark:border-slate-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
        </div>
      ) : repairs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center">
          <Wrench size={28} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-slate-500 text-sm mb-2">No repairs linked to your account yet.</p>
          <p className="text-xs text-gray-300 dark:text-slate-600 mb-4">Create a repair job online — bring your device in or have a rider collect it.</p>
          <Link href="/repair" className="text-sm font-semibold px-5 py-2.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition">
            Create a Repair Job
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  <th className="px-5 py-3">Device</th>
                  <th className="px-5 py-3">Job #</th>
                  <th className="px-5 py-3">Fault</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {repairs.map((j) => {
                  const badge = REPAIR_STATUS[j.status] || REPAIR_STATUS.received;
                  const device = [j.deviceBrand, j.deviceModel].filter(Boolean).join(" ") || "Device";
                  const href = isStaff && j?._id
                    ? `/dashboard/pos/jobs/${j._id}`
                    : j.trackingToken ? `/track/${j.trackingToken}` : null;
                  return (
                    <tr
                      key={j._id}
                      onClick={() => href && router.push(href)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{device}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-gray-500 dark:text-slate-400 whitespace-nowrap">{j.jobNumber || "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-slate-400 truncate max-w-[220px]">{j.faultDescription || "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(j.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full capitalize whitespace-nowrap ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {href ? (
                          <Link
                            href={href}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-block text-xs font-semibold px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white transition"
                          >
                            View
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
