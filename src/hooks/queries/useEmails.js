import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Admin email logs (GET /admin/email-logs). `params` may include
// { page, limit, type, status, q }. Returns { logs, total, page, pages, summary }.
export function useEmailLogs(params = {}, options = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "all") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.emails.list(params),
    queryFn: () => api.get(`/admin/email-logs${suffix}`).then((r) => r.data),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    ...options,
  });
}
