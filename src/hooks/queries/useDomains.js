import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

// Admin domain orders with an optional status filter (search is client-side).
export function useAdminDomainOrders(status = "all", options = {}) {
  const suffix = status && status !== "all" ? `?status=${status}` : "";
  return useQuery({
    queryKey: qk.domains.list({ status }),
    queryFn: () =>
      api.get(`/domain/orders${suffix}`).then((r) => r.data?.data ?? r.data ?? []),
    staleTime: 20_000,
    ...options,
  });
}

export function useUpdateDomainOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) =>
      api.patch(`/domain/orders/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.domains.all }),
  });
}

// Admin: re-attempt Namecheap registration for a paid order that failed to register.
export function useRetryDomainRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.post(`/domain/orders/${id}/retry-registration`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.domains.all }),
  });
}
