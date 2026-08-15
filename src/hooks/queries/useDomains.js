import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// The caller's domain orders (GET /domain/orders — scoped server-side).
export function useDomainOrders(options = {}) {
  return useQuery({
    queryKey: qk.domains.mine,
    queryFn: () => api.get("/domain/orders").then((r) => r.data ?? []),
    staleTime: 30_000,
    ...options,
  });
}
