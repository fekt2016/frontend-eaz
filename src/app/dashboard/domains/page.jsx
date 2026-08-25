"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { RegisteredDomainCard } from "@/components/dashboard/customer/CustomerCards";
import { useMyRegisteredDomains } from "@/hooks/queries/useDomains";

export default function CustomerDomainsPage() {
  const { data: domains = [], isLoading: loading } = useMyRegisteredDomains();

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900 dark:text-white">All Domains</h1>
          <p className="text-sm text-gray-600 dark:text-slate-500 mt-0.5">Your registered domain names and their status.</p>
        </div>
        <Link href="/domains" className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
          + Register Domain
        </Link>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-gray-200 dark:border-slate-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
        </div>
      ) : domains.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center">
          <Globe size={28} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-slate-500 text-sm mb-4">No domains registered yet.</p>
          <Link href="/domains" className="text-sm font-semibold px-5 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
            Search Domains
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {domains.map((d) => <RegisteredDomainCard key={d._id || d.domain} domain={d} />)}
        </div>
      )}
    </div>
  );
}