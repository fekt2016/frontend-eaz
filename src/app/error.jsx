"use client";

import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import StarRule from "@/components/common/StarRule";

/*
 * The global error boundary.
 *
 * Previously written entirely in inline styles — which the style guide
 * explicitly forbids — on a cool #f9fafb background, in system sans, with no
 * dark mode. It was the one screen users see when something breaks, and it
 * looked like it belonged to a different product. This is the same screen in
 * the house system: warm paper/ink, Space Grotesk, the star rule, dark mode.
 *
 * error.jsx renders inside the root layout, so globals.css and the brand fonts
 * are available; there is no reason to inline anything here.
 */
export default function Error({ error, reset }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-paper dark:bg-ink">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-error-surface dark:bg-error-surface-dark">
          <AlertTriangle size={24} aria-hidden="true" className="text-error dark:text-error-dark" />
        </div>

        <div className="flex justify-center mb-5">
          <StarRule />
        </div>

        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-3">
          This page didn&apos;t load
        </h1>
        <p className="text-body text-gray-600 dark:text-slate-400 mb-8">
          Something on our side failed while building the page. Trying again usually works — if it
          doesn&apos;t, head back home and we&apos;ll pick it up from there.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()}>Try again</Button>
          <Button href="/" variant="secondary">
            Go home
          </Button>
        </div>

        {error?.digest && (
          <p className="mt-8 font-mono text-caption text-gray-600 dark:text-slate-400">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
