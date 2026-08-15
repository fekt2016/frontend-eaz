import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// All reviews incl. pending (GET /reviews/all) — admin.
export function useAllReviews(options = {}) {
  return useQuery({
    queryKey: qk.reviews.list,
    queryFn: () => api.get("/reviews/all").then((r) => r.data ?? []),
    staleTime: 30_000,
    ...options,
  });
}

function useReviewMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.reviews.all }),
  });
}
export function useApproveReview() {
  return useReviewMutation(({ id, approved }) =>
    api.patch(`/reviews/${id}/approve`, { approved }).then((r) => r.data));
}
export function useDeleteReview() {
  return useReviewMutation((id) => api.delete(`/reviews/${id}`));
}
