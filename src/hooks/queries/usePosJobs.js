import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Repair jobs list (GET /pos/jobs) with server-side paging/filter. `params` may
// include { page, limit, status, q, priority, assignedTo }. Returns { data, total }.
export function useJobs(params = {}, options = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "all") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.jobs.list(params),
    queryFn: () =>
      api.get(`/pos/jobs${suffix}`).then((r) => ({ data: r.data ?? [], total: r.total ?? 0 })),
    staleTime: 15_000,
    placeholderData: keepPreviousData, // smooth paging/filtering
    ...options,
  });
}

// Warranty buckets (GET /pos/warranty) — { active, expiringSoon, expired }.
export function useWarrantyJobs(options = {}) {
  return useQuery({
    queryKey: qk.jobs.warranty,
    queryFn: () => api.get("/pos/warranty").then((r) => r.data),
    staleTime: 30_000,
    ...options,
  });
}
