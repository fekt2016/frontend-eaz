import { QueryClient } from "@tanstack/react-query";

// Single source of QueryClient defaults for the whole app. A factory (not a
// module-level singleton) so the provider can create one instance per app mount
// — avoids sharing cache across users during SSR and across tests.
//
// Default tuning is conservative-fresh: most server data here changes often
// (orders, stock, repair status), so a short staleTime with no window-focus
// refetch keeps things current without hammering the API. Individual hooks
// override staleTime per feature (see hooks/queries/*).
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000, // 30s — treat data as fresh briefly to dedupe bursts
        gcTime: 5 * 60_000, // keep unused cache 5 min before garbage-collecting
        refetchOnWindowFocus: false, // opt-in per hook; avoids surprise refetches
        retry: (failureCount, error) => {
          // Never retry auth/permission/not-found — retrying can't fix them.
          const status = error?.status;
          if (status === 401 || status === 403 || status === 404) return false;
          return failureCount < 2; // otherwise up to 2 retries (transient errors)
        },
      },
      mutations: {
        retry: false, // mutations are not idempotent by default — don't auto-retry
      },
    },
  });
}
