import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Drop empty params so the key and the URL stay stable.
const buildQuery = (params) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  ).toString();
  return qs ? `?${qs}` : "";
};

// Ring up a POS sale (POST /pos/sales). It deducts stock server-side, so on
// success we refresh inventory + parts caches. Body money is already pesewas.
export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/pos/sales", body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["parts"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      // Keep the Sell page's sales section in step with what was just rung up.
      qc.invalidateQueries({ queryKey: qk.posSales.all });
    },
  });
}

// Sales list for the Sell page's tracking section. The server scopes this by role —
// staff only ever get their own sales, and passing cashierId as staff cannot widen
// it — so there is no client-side filtering to get wrong here.
export function usePosSalesList(params = {}, options = {}) {
  return useQuery({
    queryKey: qk.posSales.list(params),
    queryFn: () =>
      api.get(`/pos/sales${buildQuery(params)}`).then((r) => ({
        data: r.data ?? [],
        total: r.total ?? 0,
        page: r.page ?? 1,
        pages: r.pages ?? 1,
      })),
    staleTime: 30_000,
    ...options,
  });
}

// Totals for the same section: every role gets `mine`; admin/superadmin also get a
// per-cashier `byStaff` breakdown.
export function usePosSalesSummary(options = {}) {
  return useQuery({
    queryKey: qk.posSales.summary,
    queryFn: () => api.get("/pos/sales/summary").then((r) => r.data),
    staleTime: 30_000,
    ...options,
  });
}
