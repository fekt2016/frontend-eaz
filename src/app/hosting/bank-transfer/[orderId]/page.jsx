"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

const BANK_DETAILS = {
  bankName: process.env.NEXT_PUBLIC_BANK_NAME || "GT Bank Ghana",
  accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "EazWorld Ltd",
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "—",
  branch: process.env.NEXT_PUBLIC_BANK_BRANCH || "Accra Main",
};

const NS1 = process.env.NEXT_PUBLIC_NAMESERVER_1 || "ns1.eazworld.com";
const NS2 = process.env.NEXT_PUBLIC_NAMESERVER_2 || "ns2.eazworld.com";

export default function BankTransferPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/hosting/orders/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch(() => {});
  }, [orderId]);

  // Show nameserver card only when customer has their own domain (not a temp eazworld.com subdomain)
  const domain = order?.domain;
  const isTempDomain = !domain || (domain.endsWith(".eazworld.com") && domain.split(".").length === 3);
  const showNameservers = domain && !isTempDomain;

  return (
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-24 pb-24">
      <div className="mx-auto max-w-xl">
        <Link href="/hosting" className="mb-6 inline-block text-sm text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition">
          ← Back to Hosting
        </Link>
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">Pay by Bank Transfer</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">
          Complete your payment using the details below. Your order will be activated within 2–4 hours after we verify the transfer.
        </p>

        {/* Bank details */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 mb-6">
          <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white mb-4">Bank details</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: "Bank", value: BANK_DETAILS.bankName },
              { label: "Account name", value: BANK_DETAILS.accountName },
              { label: "Account number", value: BANK_DETAILS.accountNumber, mono: true },
              { label: "Branch", value: BANK_DETAILS.branch },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex justify-between border-b border-gray-100 dark:border-slate-700 pb-2">
                <span className="text-gray-500 dark:text-slate-400">{label}</span>
                <span className={mono ? "font-mono text-gray-900 dark:text-white" : "text-gray-900 dark:text-white"}>{value}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <span className="text-gray-500 dark:text-slate-400">Reference</span>
              <span className="font-mono text-brand-500">{orderId}</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400 dark:text-slate-500">Use your order reference when making the transfer so we can match your payment.</p>
        </div>

        {/* Nameserver card — only for own-domain orders */}
        {showNameservers && (
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6 mb-6">
            <h2 className="font-display text-base font-semibold text-brand-900 mb-1">
              📡 While you wait — point your domain
            </h2>
            <p className="text-xs text-brand-700 mb-4">
              Log in to your domain registrar and update the nameservers for <strong className="font-mono">{domain}</strong> to:
            </p>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between bg-white rounded-xl px-4 py-2.5 border border-brand-100">
                <span className="text-gray-400 font-sans text-xs">Nameserver 1</span>
                <span className="font-semibold text-gray-900">{NS1}</span>
              </div>
              <div className="flex justify-between bg-white rounded-xl px-4 py-2.5 border border-brand-100">
                <span className="text-gray-400 font-sans text-xs">Nameserver 2</span>
                <span className="font-semibold text-gray-900">{NS2}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-brand-700">
              DNS changes take 24–48 hours to propagate. Your hosting credentials will be emailed to you once your payment is confirmed.
            </p>
          </div>
        )}

        {/* What happens next */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 mb-8">
          <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white mb-2">What happens next?</h2>
          <ul className="text-sm text-gray-500 dark:text-slate-400 space-y-2">
            <li>1. Transfer the exact order amount to the account above with your order reference.</li>
            <li>2. We&apos;ll confirm your payment within 2–4 hours.</li>
            {showNameservers && <li>3. Update your nameservers (above) while you wait — saves time once hosting is active.</li>}
            <li>{showNameservers ? "4." : "3."} You&apos;ll receive an email with your cPanel login details when your hosting is active.</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/hosting" className="rounded-full border border-gray-200 dark:border-slate-700 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition">Back to Hosting</Link>
          <Link href="/dashboard" className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition">Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
