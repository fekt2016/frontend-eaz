import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Suppliers list (GET /pos/suppliers). `params` may include { q }.
export function useSuppliers(params = {}, options = {}) {
  const qs = new URLSearchParams();
  if (params.q && params.q.trim()) qs.set("q", params.q.trim());
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.suppliers.list(params),
    queryFn: () => api.get(`/pos/suppliers${suffix}`).then((r) => r.data ?? []),
    staleTime: 30_000,
    ...options,
  });
}

// One supplier + its parts (GET /pos/suppliers/:id → { supplier, parts }).
export function useSupplier(id, options = {}) {
  return useQuery({
    queryKey: qk.suppliers.detail(id),
    queryFn: () => api.get(`/pos/suppliers/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
    ...options,
  });
}

function useSupplierMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.suppliers.all }),
  });
}
export function useCreateSupplier() {
  return useSupplierMutation((body) => api.post("/pos/suppliers", body).then((r) => r.data));
}
export function useUpdateSupplier() {
  return useSupplierMutation(({ id, ...body }) => api.patch(`/pos/suppliers/${id}`, body).then((r) => r.data));
}
export function useDeleteSupplier() {
  return useSupplierMutation((id) => api.delete(`/pos/suppliers/${id}`));
}
