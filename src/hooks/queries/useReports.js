import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Consolidated Reports & Analytics (GET /pos/reports/analytics). The backend
// aggregates revenue (repair payments + POS sales + online orders), orders,
// repairs, inventory, expenses and shipping statuses server-side for the
// requested range — the browser never pulls raw records. `range` = { from, to }
// in YYYY-MM-DD. `staffId` scopes the report to one staff member's own
// activity (T32) — for a `staff` caller the backend forces this to their own
// id regardless of what's sent, so passing it is only meaningful for
// admin/superadmin. Returns the full report payload as `r.data`.
export function useReportsAnalytics(range = {}, staffId, options = {}) {
  const qs = new URLSearchParams();
  if (range.from) qs.set("from", range.from);
  if (range.to) qs.set("to", range.to);
  if (staffId) qs.set("staffId", staffId);
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.reports.analytics({ ...range, staffId: staffId || undefined }),
    queryFn: () => api.get(`/pos/reports/analytics${suffix}`).then((r) => r.data),
    staleTime: 60_000, // analytics are slow-changing; refetch on demand
    placeholderData: keepPreviousData, // keep old numbers while a new range loads
    ...options,
  });
}
