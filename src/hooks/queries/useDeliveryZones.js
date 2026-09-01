import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// All delivery zones incl. inactive (GET /delivery-zones/all). `fee` is pesewas.
export function useDeliveryZones(options = {}) {
  return useQuery({
    queryKey: qk.deliveryZones.list,
    queryFn: () => api.get("/delivery-zones/all").then((r) => r.data ?? []),
    staleTime: 60_000,
    ...options,
  });
}

// Public active delivery zones (GET /delivery-zones) — the visitor-facing
// checkout (track page) picks a zone here, so it must never see inactive ones.
export function usePublicDeliveryZones(options = {}) {
  return useQuery({
    queryKey: qk.deliveryZones.public,
    queryFn: () => api.get("/delivery-zones").then((r) => r.data ?? []),
    staleTime: 60_000,
    ...options,
  });
}

function useZoneMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.deliveryZones.all }),
  });
}
export function useCreateZone() {
  return useZoneMutation((body) => api.post("/delivery-zones", body).then((r) => r.data));
}
export function useUpdateZone() {
  return useZoneMutation(({ id, ...body }) => api.patch(`/delivery-zones/${id}`, body).then((r) => r.data));
}
export function useDeleteZone() {
  return useZoneMutation((id) => api.delete(`/delivery-zones/${id}`));
}
