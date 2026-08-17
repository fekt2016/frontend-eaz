import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function HostingOrderConfirmationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 pt-24 pb-24 flex items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <CheckCircle2 size={48} className="text-emerald-500 text-5xl mx-auto mb-6" />
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-2">Order confirmed</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">
          Thank you for your order. We&apos;ll activate your hosting shortly and send you an email with account details.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="rounded-full bg-gray-900 px-6 py-3 font-semibold text-white hover:bg-gray-700 transition">
            Go to Dashboard
          </Link>
          <Link href="/hosting" className="rounded-full border border-gray-200 dark:border-slate-700 px-6 py-3 font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition">
            Back to Hosting
          </Link>
        </div>
      </div>
    </div>
  );
}
