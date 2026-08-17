"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

const CONTENT = {
  service: {
    title:    "Deposit Received!",
    message:  "Thank you for your payment. Your deposit has been received and your project slot is secured. We'll be in touch within 24 hours to discuss your requirements.",
    primary:  { label: "Go to Dashboard", href: "/dashboard" },
    secondary: { label: "View Services", href: "/services/web-design" },
  },
  domain: {
    title:    "Payment Successful",
    message:  "Thank you. Your domain order is being processed. You can track it from your dashboard.",
    primary:  { label: "Go to Dashboard", href: "/dashboard" },
    secondary: { label: "Search More Domains", href: "/domains" },
  },
  hosting: {
    title:    "Hosting Order Confirmed!",
    message:  "Your hosting account is being set up. You'll receive login details by email within a few minutes.",
    primary:  { label: "Go to Dashboard", href: "/dashboard" },
    secondary: { label: "View Hosting Plans", href: "/hosting" },
  },
  default: {
    title:    "Payment Successful",
    message:  "Thank you for your payment. You can track your order from your dashboard.",
    primary:  { label: "Go to Dashboard", href: "/dashboard" },
    secondary: { label: "Go Home", href: "/" },
  },
};

function PaymentSuccessContent() {
  const params = useSearchParams();
  const type   = params.get("type") || "default";
  const content = CONTENT[type] || CONTENT.default;

  return (
    <div className="min-h-[60vh] bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4 pt-24">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={36} className="text-emerald-500" />
        </div>
        <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-4">{content.title}</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-8 leading-relaxed">{content.message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={content.primary.href} className="inline-block px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm">
            {content.primary.label}
          </Link>
          <Link href={content.secondary.href} className="inline-block px-6 py-3 rounded-full border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-semibold hover:border-gray-400 dark:hover:border-slate-500 transition text-sm">
            {content.secondary.label}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense>
      <PaymentSuccessContent />
    </Suspense>
  );
}
