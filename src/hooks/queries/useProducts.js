import { useQuery } from "@tanstack/react-query";
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

export function useProductBySlug(slug, options = {}) {
  return useQuery({
    queryKey: qk.products.detail(slug),
    queryFn: () => api.get(`/products/${encodeURIComponent(slug)}`).then((r) => r.data),
    enabled: !!slug,
    staleTime: 60_000,
    ...options,
  });
}
