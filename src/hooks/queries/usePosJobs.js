import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
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

// Public self-serve repair booking (POST /track/repair-requests) — no auth.
export function useCreatePublicJob() {
  return useMutation({
    mutationFn: (body) => api.post("/track/repair-requests", body).then((r) => r.data),
  });
}

// Job intake photos (multipart upload / delete). The caller refreshes the job
// via its own callback, so these don't invalidate a job query.
export function useUploadJobPhoto(jobId) {
  return useMutation({ mutationFn: (formData) => api.upload(`/pos/jobs/${jobId}/photos`, formData) });
}
export function useDeleteJobPhoto(jobId) {
  return useMutation({ mutationFn: (photoId) => api.delete(`/pos/jobs/${jobId}/photos/${photoId}`) });
}

// Single job with its payments attached (GET /pos/jobs/:id). r.data is the
// populated job — GET /:id resolves to { ...job, payments }.
export function useJobDetail(id, options = {}) {
  return useQuery({
    queryKey: qk.jobs.detail(id),
    queryFn: () => api.get(`/pos/jobs/${id}`).then((r) => r.data),
    enabled: !!id,
    retry: false,
    staleTime: 15_000,
    ...options,
  });
}

// Staff mutations against one job. Each invalidates the whole jobs prefix so the
// list, the filters, and this job's own detail all refresh in step.
const usePosJobsMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.jobs.all }),
  });
};

export function useUpdateJob(id) {
  return usePosJobsMutation((body) =>
    api.patch(`/pos/jobs/${id}`, body).then((r) => r.data));
}
export function useAddJobPayment(id) {
  return usePosJobsMutation((body) =>
    api.post(`/pos/jobs/${id}/payments`, body).then((r) => r.data));
}
export function useCreatePosJob() {
  return usePosJobsMutation((body) => api.post("/pos/jobs", body).then((r) => r.data));
}

// Customer autocomplete for intake (GET /pos/customers?q=...&limit=6). Debounce
// the term in the component (`useDebounce`). Enabled only once 2+ characters are
// typed so we never fetch the whole table — callers can gate further with
// `enabled` (e.g. skip while a customer is already selected), but never bypass
// the minimum-length guard.
export function useCustomerSearch(q, options = {}) {
  const term = (q || "").trim();
  const { enabled = true, ...rest } = options;
  return useQuery({
    queryKey: qk.pos.customers(term),
    queryFn: () =>
      api.get(`/pos/customers?q=${encodeURIComponent(term)}&limit=6`).then((r) => r.data ?? []),
    enabled: enabled && term.length >= 2,
    staleTime: 30_000,
    ...rest,
  });
}

// The in-store technician roster for assigning repairs (GET /pos/technicians).
export function useTechnicians(options = {}) {
  return useQuery({
    queryKey: qk.pos.technicians,
    queryFn: () => api.get("/pos/technicians").then((r) => r.data ?? []),
    staleTime: 60_000,
    ...options,
  });
}

// Create/lookup a POS customer (POST /pos/customers). Returns the raw envelope:
// a fresh phone → { success, data: <customer>, account }; an existing match →
// { success, data: <customer>, existing: true }. Callers read `r.data._id` and
// `r.existing`. Refreshes the autocomplete on success so the new customer is
// findable immediately.
export function useCreatePosCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/pos/customers", body).then((r) => r),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pos", "customers"] }),
  });
}
