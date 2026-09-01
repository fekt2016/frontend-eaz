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

// NOTE (T109): `useAdminProducts` — the paginated GET /products/all list — was
// removed here, not just un-pinned. Its ONLY caller was the product edit page,
// which used it to hunt for one record inside the array; that is now
// `useAdminProduct(id)` below. Leaving the hook behind would have left a
// footgun: `/all` defaults to 10 per page, so a hook named "all products"
// would quietly return ten. This repo has been bitten by exactly that shape of
// rot before — see the dead `useContacts.js` in T129. Bring it back with an
// explicit page/limit signature if a real list view needs one.

// One product by _id for the admin edit form (GET /products/id/:id, T109).
// Unlike `useProduct(slug)` this hits the admin route, so it resolves an
// archived product — which is exactly when the record still needs opening.
export function useAdminProduct(id, options = {}) {
  return useQuery({
    queryKey: qk.products.adminDetail(id),
    queryFn: () => api.get(`/products/id/${encodeURIComponent(id)}`).then((r) => r.data),
    enabled: !!id,
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
