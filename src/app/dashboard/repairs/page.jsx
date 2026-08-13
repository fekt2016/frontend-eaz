"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaTools } from "react-icons/fa";
import { api } from "@/lib/api";
import { RepairCard } from "@/components/dashboard/customer/CustomerCards";

export default function CustomerRepairsPage() {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/track/mine")
      .then((res) => setRepairs(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          <FaTools size={28} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-slate-500 text-sm mb-2">No repairs linked to your account yet.</p>
          <p className="text-xs text-gray-300 dark:text-slate-600 mb-4">Create a repair job online — bring your device in or have a rider collect it.</p>
          <Link href="/repair" className="text-sm font-semibold px-5 py-2.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition">
            Create a Repair Job
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {repairs.map((j) => <RepairCard key={j._id} job={j} />)}
        </div>
      )}
    </div>
  );
}