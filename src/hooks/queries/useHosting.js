import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

// Hosting plan catalogue (GET /hosting/plans) — for the staff create-account form.
export function useHostingPlans(options = {}) {
  return useQuery({
    queryKey: qk.hosting.plans,
    queryFn: () => api.get("/hosting/plans").then((r) => r.data?.data ?? r.data ?? {}),
    staleTime: 5 * 60_000,
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

// Admin summary cards (GET /hosting/orders/admin-summary).
export function useHostingSummary(options = {}) {
  return useQuery({
    queryKey: qk.hosting.adminSummary,
    queryFn: () => api.get("/hosting/orders/admin-summary").then((r) => r.data ?? null),
    staleTime: 30_000,
    ...options,
  });
}

// Admin hosting orders list, filtered by status + search (GET /hosting/orders).
export function useAdminHostingOrders(status = "all", search = "", options = {}) {
  const p = new URLSearchParams();
  if (status && status !== "all") p.set("status", status);
  if (search && search.trim()) p.set("q", search.trim());
  const suffix = p.toString() ? `?${p}` : "";
  return useQuery({
    queryKey: qk.hosting.adminList({ status, search }),
    queryFn: () => api.get(`/hosting/orders${suffix}`).then((r) => r.data ?? []),
    staleTime: 20_000,
    ...options,
  });
}

// After any hosting change, refresh the whole hosting domain (list/summary/overview).
function useHostingMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.hosting.all }),
  });
}
export function useUpdateHostingOrderStatus() {
  return useHostingMutation(({ id, status }) =>
    api.patch(`/hosting/orders/${id}`, { status }).then((r) => r.data));
}
export function useHostingLifecycle() {
  // action = suspend | unsuspend | terminate ; terminate needs { confirm: true }
  return useHostingMutation(({ id, action, body = {} }) =>
    api.post(`/hosting/orders/${id}/${action}`, body).then((r) => r.data));
}
export function useDeleteHostingOrder() {
  return useHostingMutation((id) => api.delete(`/hosting/orders/${id}`));
}

// Public payment checkout (POST /hosting/orders) — creates the hosting order and
// returns a Paystack link. Returns r.data — { authorizationUrl, orderId }.
export function useCreateHostingOrder() {
  return useHostingMutation((body) => api.post("/hosting/orders", body).then((r) => r.data));
}

// Staff/admin: create a cPanel hosting account for a customer in-store
// (cash → provisioned now; paystack → returns a payment link).
export function useStaffCreateHostingAccount() {
  return useHostingMutation((payload) =>
    api.post("/hosting/orders/staff-create", payload).then((r) => r.data));
}

// T68 — paid VPS/Cloud/Email orders auto-provisioning skipped, oldest first.
// Somebody has to build those servers by hand; this is the work list.
export function useAwaitingProvisioning(options = {}) {
  return useQuery({
    queryKey: qk.hosting.awaitingProvisioning,
    queryFn: () => api.get("/hosting/orders/awaiting-provisioning").then((r) => r.data ?? []),
    staleTime: 15_000,
    ...options,
  });
}

// Mark a manually built order provisioned: activates it, stamps expiry and
// emails the credentials. Invalidating the whole hosting domain also refreshes
// the queue (the order leaves it) and the admin lists (its status changed).
export function useMarkProvisioned() {
  return useHostingMutation(({ id, ...body }) =>
    api.patch(`/hosting/orders/${id}/mark-provisioned`, body).then((r) => r));
}
