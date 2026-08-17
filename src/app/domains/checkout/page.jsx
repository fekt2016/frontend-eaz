"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import CheckoutForm from "@/components/CheckoutForm";

function CheckoutContentInner() {
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") || "";
  const price = searchParams.get("price") || "";

  if (!domain || !price) {
    return (
      <div className="min-h-[60vh] px-4 pt-24 pb-20">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-display font-bold text-4xl text-gray-900 dark:text-white mb-4">Checkout</h1>
          <p className="text-gray-500 dark:text-slate-400 mb-6">Missing domain or price. Search for a domain first.</p>
          <Link href="/domains" className="text-brand-500 hover:underline text-sm">
            ← Back to domain search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-paper dark:bg-ink px-4 pt-24 pb-20">
      <div className="max-w-2xl mx-auto">
        <Link href="/domains" className="text-gray-400 dark:text-slate-500 text-sm hover:text-gray-700 dark:hover:text-slate-300 transition mb-8 inline-block">
          ← Back to Domains
        </Link>
        <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">Checkout</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-1 font-mono">{domain}</p>
        <p className="text-brand-500 font-semibold mb-8">${price}<span className="text-gray-400 dark:text-slate-500 font-normal text-xs">/yr</span></p>

        <div className="flex flex-wrap gap-4 mb-8 text-xs text-gray-400 dark:text-slate-500">
          <span>🔒 SSL Secured</span>
          <span>⚡ Instant Activation</span>
          <span>📞 24/7 Support</span>
          <span>📱 MTN MoMo · Vodafone Cash · Card</span>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <CheckoutForm domain={domain} price={parseFloat(price)} />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] px-4 pt-24 flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading...</p>
      </div>
    }>
      <CheckoutContentInner />
    </Suspense>
  );
}
