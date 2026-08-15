import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Shop orders (admin/staff). `params` may include { status, limit }.
export function useOrders(params = {}, options = {}) {
  const qs = new URLSearchParams();
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.orders.list(params),
    queryFn: () => api.get(`/orders${suffix}`).then((r) => r.data ?? []),
    staleTime: 15_000, // order status changes often — keep it fresh
    ...options,
  });
}

// Recent shop orders for dashboards. The backend already sorts newest-first
// and is gated to admin/staff, so this returns exactly what should be shown.
export function useRecentOrders(limit = 5, options = {}) {
  return useQuery({
    queryKey: qk.orders.recent,
    queryFn: () => api.get(`/orders?limit=${limit}`).then((r) => r.data ?? []),
    staleTime: 15_000,
    ...options,
  });
}

// The logged-in customer's own shop orders (matched by phone/email server-side).
export function useMyOrders(options = {}) {
  return useQuery({
    queryKey: qk.orders.mine,
    queryFn: () => api.get("/orders/mine").then((r) => r.data ?? []),
    staleTime: 30_000,
    ...options,
  });
}

// A single order — admin/staff detail (GET /orders/:id).
export function useOrder(id, options = {}) {
  return useQuery({
    queryKey: qk.orders.detail(id),
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 15_000,
    ...options,
  });
}

// A customer's own order detail (GET /orders/mine/:id — ownership checked server-side).
export function useMyOrder(id, options = {}) {
  return useQuery({
    queryKey: qk.orders.detail(id),
    queryFn: () => api.get(`/orders/mine/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
    ...options,
  });
}

// Update an order's status. On success, refresh everything under ["orders"]
// (lists, recent, and this order's detail all live under that prefix) — scoped
// to the orders domain, not the whole cache.
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) =>
      api.patch(`/orders/${id}`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.orders.all });
    },
  });
}

// Append a tracking event (status/note/location) to an order — staff/admin.
export function useAddTrackingEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) =>
      api.post(`/orders/${id}/tracking`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orders.all }),
  });
}
