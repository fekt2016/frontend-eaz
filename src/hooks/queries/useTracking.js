import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Public shop-order tracking (GET /orders/track/:trackingNumber). Returns a
// minimal, safe payload: { trackingNumber, orderNumber, status, destination,
// createdAt, history, latestEvent }. One query serves both the tracking-detail
// page (full history) and an order page that only needs `latestEvent` — they
// share the same cache entry, so the latest update costs no extra request.
export function useOrderTracking(trackingNumber, options = {}) {
  const tn = String(trackingNumber || "").trim();
  return useQuery({
    queryKey: qk.orders.tracking(tn),
    queryFn: () =>
      api.get(`/orders/track/${encodeURIComponent(tn)}`).then((r) => r.data),
    enabled: !!tn,
    staleTime: 20_000, // tracking status can change; refetch on demand
    ...options,
  });
}
