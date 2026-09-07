import { QueryClient } from "@tanstack/react-query";

// Single source of QueryClient defaults for the whole app. A factory (not a
// module-level singleton) so the provider can create one instance per app mount
// — avoids sharing cache across users during SSR and across tests.
//
// Default tuning is LIVE: a screen should show what the database says without
// anyone pressing refresh. Two staff work the same orders at once, and a stale
// screen is how an order gets packed after it was cancelled.
//
// Three mechanisms, cheapest first:
//
//   refetchOnWindowFocus  the common case, and free. Coming back to the tab
//                         refetches — but only what staleTime already considers
//                         stale, so flicking between tabs costs nothing.
//   refetchOnReconnect    a dropped connection is exactly when a screen goes
//                         quietly out of date.
//   refetchInterval       for the screen someone is actually watching while a
//                         colleague changes the data underneath them.
//
// Why polling rather than WebSockets: the API runs under Phusion Passenger on
// cPanel, which idles the app out when traffic stops (docs/HOSTING.md) and may
// run more than one process. An idled app holds no socket and pushes nothing,
// and with N processes an event raised in one never reaches a client attached
// to another — there is no shared adapter here to fix that. server.js has an
// optional socket.io hook that has never had a server behind it. Polling
// survives both conditions, and every request re-authenticates normally.
//
// Individual hooks override any of this (see hooks/queries/*): useNotifications
// keeps its own cadence, and the Paystack charge poller runs at 4s and stops
// itself once the charge lands.
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000, // 30s — treat data as fresh briefly to dedupe bursts
        gcTime: 5 * 60_000, // keep unused cache 5 min before garbage-collecting
        refetchOnWindowFocus: true, // returning to the tab shows current data
        refetchOnReconnect: true, // and so does coming back online
        // Poll the screen someone is looking at. 30s rather than something
        // snappier because the API runs on a 512MB heap and every mounted query
        // on the page polls independently — a dashboard with five of them is
        // five requests a cycle, per open tab.
        refetchInterval: 30_000,
        // Explicit, though it is also the default: a hidden tab polls nothing.
        // Without this a laptop left open overnight on the orders page would
        // spend the night querying.
        refetchIntervalInBackground: false,
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
