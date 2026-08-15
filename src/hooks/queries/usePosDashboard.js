import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Personal POS dashboard for the logged-in user (staff/technician).
export function useMyOverview(options = {}) {
  return useQuery({
    queryKey: qk.pos.myOverview,
    queryFn: () => api.get("/pos/my-overview").then((r) => r.data),
    staleTime: 20_000,
    ...options,
  });
}

// Shop-wide POS overview (admin/superadmin). `range` = { from, to }.
export function useOverview(range = {}, options = {}) {
  const qs = new URLSearchParams();
  if (range.from) qs.set("from", range.from);
  if (range.to) qs.set("to", range.to);
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.pos.overview(range),
    queryFn: () => api.get(`/pos/overview${suffix}`).then((r) => r.data),
    staleTime: 30_000,
    ...options,
  });
}

// Online repair part/repair orders (GET /pos/part-orders).
export function usePartOrders(status = "all", options = {}) {
  const suffix = status && status !== "all" ? `?status=${status}` : "";
  return useQuery({
    queryKey: qk.pos.partOrders(status),
    queryFn: () => api.get(`/pos/part-orders${suffix}`).then((r) => r.data ?? []),
    staleTime: 20_000,
    ...options,
  });
}

// Update a part-order (or repair-order) status; refreshes the part-orders list.
export function useUpdatePosOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, orderType }) => {
      const endpoint = orderType === "repair" ? `/pos/repair-orders/${id}` : `/pos/part-orders/${id}`;
      return api.patch(endpoint, { status }).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pos", "part-orders"] }),
  });
}
