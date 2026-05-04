"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const BANK_DETAILS = {
  bankName: "GT Bank Ghana",
  accountName: "EazWorld Ltd",
  accountNumber: "0123456789012",
  branch: "Accra Main",
};

export default function BankTransferPage() {
  const { orderId } = useParams();

  return (
    <div className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="mx-auto max-w-xl">
        <Link href="/hosting" className="mb-6 inline-block text-sm text-gray-400 hover:text-gray-700 transition">
          ← Back to Hosting
        </Link>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Pay by Bank Transfer</h1>
        <p className="text-gray-500 text-sm mb-8">
          Complete your payment using the details below. Your order will be activated within 2–4 hours after we verify the transfer.
        </p>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 mb-8">
          <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">Bank details</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: "Bank", value: BANK_DETAILS.bankName },
              { label: "Account name", value: BANK_DETAILS.accountName },
              { label: "Account number", value: BANK_DETAILS.accountNumber, mono: true },
              { label: "Branch", value: BANK_DETAILS.branch },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">{label}</span>
                <span className={mono ? "font-mono text-gray-900" : "text-gray-900"}>{value}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2">
              <span className="text-gray-500">Reference</span>
              <span className="font-mono text-amber-500">{orderId}</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">Use your order reference when making the transfer so we can match your payment.</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 mb-8">
          <h2 className="font-display text-lg font-semibold text-gray-900 mb-2">What happens next?</h2>
          <ul className="text-sm text-gray-500 space-y-2">
            <li>1. Transfer the exact order amount to the account above with your order reference.</li>
            <li>2. We&apos;ll confirm your payment within 2–4 hours.</li>
            <li>3. You&apos;ll receive an email when your hosting is active.</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/hosting" className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-400 transition">Back to Hosting</Link>
          <Link href="/dashboard" className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition">Go to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
