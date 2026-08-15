import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Client-side product listing (GET /products). Public shop pages render via
// Server Components (lib/products.js) — use this only for interactive client
// widgets that need caching/refetch.
export function useProducts(params = {}, options = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.products.list(params),
    queryFn: () => api.get(`/products${suffix}`).then((r) => r.data ?? []),
    staleTime: 60_000, // catalogue changes rarely
    ...options,
  });
}

// Paginated shop listing for the storefront grid — returns the full envelope
// { data, total, pages, page } so the grid can render pagination.
export function useShopProducts(params = {}, options = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.products.list(params),
    queryFn: () =>
      api.get(`/products${suffix}`).then((r) => ({
        data: r.data ?? [],
        total: r.total ?? 0,
        pages: r.pages ?? 1,
        page: r.page ?? 1,
      })),
    staleTime: 30_000,
    ...options,
  });
}

export function useProductBySlug(slug, options = {}) {
  return useQuery({
    queryKey: qk.products.detail(slug),
    queryFn: () => api.get(`/products/${encodeURIComponent(slug)}`).then((r) => r.data),
    enabled: !!slug,
    staleTime: 60_000,
    ...options,
  });
}

// Admin product list, incl. inactive (GET /products/all).
export function useAdminProducts(options = {}) {
  return useQuery({
    queryKey: qk.products.admin,
    queryFn: () => api.get("/products/all").then((r) => r.data ?? []),
    staleTime: 30_000,
    ...options,
  });
}

function useProductMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.products.all });
      qc.invalidateQueries({ queryKey: qk.inventory.all }); // catalogue merges parts+products
    },
  });
}
export function useCreateProduct() {
  return useProductMutation((data) => api.post("/products", data).then((r) => r.data));
}
export function useUpdateProduct() {
  return useProductMutation(({ id, data }) => api.patch(`/products/${id}`, data).then((r) => r.data));
}
export function useDeleteProduct() {
  return useProductMutation((id) => api.delete(`/products/${id}`));
}
export function useRestoreProduct() {
  return useProductMutation((id) => api.patch(`/products/${id}`, { isActive: true }).then((r) => r.data));
}
