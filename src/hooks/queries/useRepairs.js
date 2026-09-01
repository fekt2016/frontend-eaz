import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Repair jobs for the current user (GET /track/mine). Staff-side roles get every
// job; customers get their own (matched by phone/email server-side).
export function useMyRepairs(options = {}) {
  return useQuery({
    queryKey: qk.repairs.mine,
    queryFn: () => api.get("/track/mine").then((r) => r.data ?? []),
    staleTime: 30_000,
    ...options,
  });
}

// Single public repair-lookup by token (GET /track/:token). The token is the
// "magic link" key — no auth, so `retry: false` mirrors the old no-retry fetch.
export function useTrackRepair(token, options = {}) {
  return useQuery({
    queryKey: qk.repairs.detail(token),
    queryFn: () => api.get(`/track/${token}`).then((r) => r.data),
    enabled: !!token,
    retry: false,
    ...options,
  });
}

// Public guest checkout against a tracked repair (POST /track/:token/orders).
// Returns r.data — { authorizationUrl, reference, repairOrderId }.
export function useCreateTrackOrder(token) {
  return useMutation({
    mutationFn: (body) => api.post(`/track/${token}/orders`, body).then((r) => r.data),
  });
}

// Public balance payment on a tracked repair (POST /track/:token/balance-payment).
// Returns r.data — { authorizationUrl, reference, repairOrderId }.
export function usePayTrackBalance(token) {
  return useMutation({
    mutationFn: (body) => api.post(`/track/${token}/balance-payment`, body).then((r) => r.data),
  });
}
