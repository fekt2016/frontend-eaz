"use client";

import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

/*
 * Dashboard-scoped error boundary. Without one, any failure in a dashboard
 * route bubbled to the root boundary and replaced the entire application —
 * sidebar, topbar and all — with the global error page. This keeps the shell
 * and confines the failure to the content region.
 */
export default function DashboardError({ error, reset }) {
  return (
    <div className="p-5 lg:p-7">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-error-surface dark:bg-error-surface-dark">
          <AlertTriangle size={22} aria-hidden="true" className="text-error dark:text-error-dark" />
        </div>
        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">
          This section didn&apos;t load
        </h2>
        <p className="text-body-sm text-gray-600 dark:text-slate-400 mb-6">
          The rest of your dashboard is still working. Try loading this section again.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => reset()}>Try again</Button>
          <Button href="/dashboard" variant="secondary">Back to overview</Button>
        </div>
        {error?.digest && (
          <p className="mt-6 font-mono text-caption text-gray-600 dark:text-slate-400">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
