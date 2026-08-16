import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Admin activity / audit log (GET /activity-logs). Admin + superadmin only —
// the backend enforces this; the page also gates on role client-side.
// `params` may include { page, limit, q, action, resourceType, role, status,
// actor, resourceId, from, to, sort }. The API returns
// { success, count, total, page, pages, data: [...] }, which we normalise here.
export function useActivityLogs(params = {}, options = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "all") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.activityLogs.list(params),
    queryFn: async () => {
      const res = await api.get(`/activity-logs${suffix}`);
      return {
        logs: res.data ?? [],
        total: res.total ?? 0,
        count: res.count ?? 0,
        page: res.page ?? 1,
        pages: res.pages ?? 1,
      };
    },
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    ...options,
  });
}
