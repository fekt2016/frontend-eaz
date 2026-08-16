import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Consolidated Reports & Analytics (GET /pos/reports/analytics). The backend
// aggregates revenue (repair payments + POS sales + online orders), orders,
// repairs, inventory, expenses and shipping statuses server-side for the
// requested range — the browser never pulls raw records. `range` = { from, to }
// in YYYY-MM-DD. Returns the full report payload as `r.data`.
export function useReportsAnalytics(range = {}, options = {}) {
  const qs = new URLSearchParams();
  if (range.from) qs.set("from", range.from);
  if (range.to) qs.set("to", range.to);
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.reports.analytics(range),
    queryFn: () => api.get(`/pos/reports/analytics${suffix}`).then((r) => r.data),
    staleTime: 60_000, // analytics are slow-changing; refetch on demand
    placeholderData: keepPreviousData, // keep old numbers while a new range loads
    ...options,
  });
}
