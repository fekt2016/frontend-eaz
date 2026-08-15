import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// The caller's hosting orders (GET /hosting/orders — scoped server-side).
export function useHostingOrders(options = {}) {
  return useQuery({
    queryKey: qk.hosting.mine,
    queryFn: () => api.get("/hosting/orders").then((r) => r.data ?? []),
    staleTime: 30_000,
    ...options,
  });
}

// Admin business overview (GET /hosting/orders/admin-overview).
export function useHostingAdminOverview(options = {}) {
  return useQuery({
    queryKey: qk.hosting.adminOverview,
    queryFn: () => api.get("/hosting/orders/admin-overview").then((r) => r.data),
    staleTime: 30_000,
    ...options,
  });
}
