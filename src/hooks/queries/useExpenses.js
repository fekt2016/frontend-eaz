import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Expenses list (GET /pos/expenses) with paging + filters. `params` may include
// { page, limit, category, from, to }. Returns { data, total, summary, totalAmount }.
export function useExpenses(params = {}, options = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "all") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.expenses.list(params),
    queryFn: () =>
      api.get(`/pos/expenses${suffix}`).then((r) => ({
        data: r.data ?? [],
        total: r.total ?? 0,
        summary: r.summary ?? [],
        totalAmount: r.totalAmount ?? 0,
      })),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    ...options,
  });
}

function useExpenseMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.expenses.all }),
  });
}

// Body money is already pesewas from the caller (cedis ×100 at the form edge).
export function useCreateExpense() {
  return useExpenseMutation((body) => api.post("/pos/expenses", body).then((r) => r.data));
}
export function useUpdateExpense() {
  return useExpenseMutation(({ id, ...body }) => api.patch(`/pos/expenses/${id}`, body).then((r) => r.data));
}
export function useDeleteExpense() {
  return useExpenseMutation((id) => api.delete(`/pos/expenses/${id}`));
}
