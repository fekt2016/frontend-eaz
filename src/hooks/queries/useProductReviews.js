import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Public approved review list for a product (paginated envelope).
export function useProductReviews(productId, options = {}) {
  return useQuery({
    queryKey: qk.productReviews.list(productId),
    queryFn: () =>
      api.get(`/products/${productId}/reviews`).then((r) => ({
        data: r.data ?? [],
        total: r.total ?? 0,
        pages: r.pages ?? 1,
        page: r.page ?? 1,
      })),
    enabled: !!productId,
    staleTime: 60_000,
    ...options,
  });
}

// Current user's review for a product (null when they haven't reviewed).
// Only meaningful for logged-in users — gate with `enabled` from the caller.
export function useMyProductReview(productId, options = {}) {
  return useQuery({
    queryKey: qk.productReviews.mine(productId),
    queryFn: () => api.get(`/products/${productId}/reviews/mine`).then((r) => r.data),
    enabled: !!productId,
    retry: false,
    ...options,
  });
}

// After any review mutation the product detail (rating summary) and the
// product-review caches must refresh together.
function useProductReviewMutation(mutationFn, productId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.productReviews.list(productId) });
      qc.invalidateQueries({ queryKey: qk.productReviews.mine(productId) });
      qc.invalidateQueries({ queryKey: qk.productReviews.all });
      qc.invalidateQueries({ queryKey: qk.products.detail });
    },
  });
}

export function useSubmitProductReview(productId) {
  return useProductReviewMutation(
    ({ rating, comment }) =>
      api.post(`/products/${productId}/reviews`, { rating, comment }).then((r) => r.data),
    productId,
  );
}

export function useUpdateProductReview(productId) {
  return useProductReviewMutation(
    ({ rating, comment }) =>
      api.patch(`/products/${productId}/reviews/mine`, { rating, comment }).then((r) => r.data),
    productId,
  );
}

// ── Admin moderation (mirrors the service-review hooks) ────────────────────
export function useAllProductReviews(options = {}) {
  return useQuery({
    queryKey: qk.productReviews.all,
    queryFn: () => api.get("/product-reviews/all").then((r) => r.data ?? []),
    staleTime: 30_000,
    ...options,
  });
}

function useProductReviewAdminMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.productReviews.all });
      qc.invalidateQueries({ queryKey: qk.productReviews.list });
      qc.invalidateQueries({ queryKey: qk.products.detail });
    },
  });
}

export function useApproveProductReview() {
  return useProductReviewAdminMutation(({ id, approved }) =>
    api.patch(`/product-reviews/${id}/approve`, { approved }).then((r) => r.data));
}

export function useDeleteProductReview() {
  return useProductReviewAdminMutation((id) => api.delete(`/product-reviews/${id}`));
}
