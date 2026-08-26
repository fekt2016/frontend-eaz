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

// T45 — paid orders with a pre-order line still waiting on stock. Server-sorted
// oldest-first, so the longest-waiting customer is at the top.
export function usePreorders(options = {}) {
  return useQuery({
    queryKey: qk.orders.preorders,
    queryFn: () => api.get("/orders/preorders").then((r) => r.data ?? []),
    staleTime: 15_000,
    ...options,
  });
}

// Release a pre-order once its stock has landed: moves stock, counts the sale,
// and emails the customer. Invalidating the whole "orders" prefix is deliberate —
// the released order also appears in the order lists and on its own detail page.
export function useReleasePreorder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/orders/${id}/preorder-release`).then((r) => r),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orders.all }),
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

// Public order-confirmation lookup by Paystack reference. Polls every 4s while
// unpaid (and the tab is focused), stopping once the order is paid.
export function useOrderByReference(reference, options = {}) {
  return useQuery({
    queryKey: ["orders", "by-reference", reference],
    queryFn: () => api.get(`/orders/by-reference/${reference}`).then((r) => r.data),
    enabled: !!reference,
    staleTime: 0,
    refetchInterval: (query) => (query.state.data?.status === "paid" ? false : 4000),
    ...options,
  });
}

// Guest order tracking (POST /orders/track — orderNumber + phone). A lookup, so
// it's a mutation, not a cached query.
export function useTrackOrder() {
  return useMutation({
    mutationFn: ({ orderNumber, phone }) =>
      api.post("/orders/track", { orderNumber, phone }).then((r) => r.data),
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
