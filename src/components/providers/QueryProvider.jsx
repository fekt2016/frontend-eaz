"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { makeQueryClient } from "@/lib/queryClient";

// One QueryClient per browser tab, a fresh one per server render. This is the
// TanStack-recommended App Router pattern — it prevents cache being shared
// between users on the server while reusing a single client in the browser.
let browserQueryClient;
function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient(); // server: always new
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

// Devtools are lazy + dev-only, so they are never included in the production bundle.
const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("@tanstack/react-query-devtools").then(
            (m) => m.ReactQueryDevtools,
          ),
        { ssr: false },
      )
    : () => null;

export default function QueryProvider({ children }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
