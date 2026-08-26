import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// T45 — incoming stock batches. Staff-only server-side; the customer's simplified
// view arrives through their order's public tracking page instead.
export function useShipments(options = {}) {
  return useQuery({
    queryKey: qk.shipments.list,
    queryFn: () => api.get("/shipments").then((r) => r.data ?? []),
    staleTime: 30_000,
    ...options,
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/shipments", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shipments.all }),
  });
}

// Moving a batch on updates every pre-order riding on it, so the pre-order queue
// and any order view reading the same data are invalidated too.
export function useAdvanceShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, note }) =>
      api.patch(`/shipments/${id}/stage`, { stage, note }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.shipments.all });
      qc.invalidateQueries({ queryKey: qk.orders.all });
    },
  });
}

export function useAttachOrdersToShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, orderIds }) =>
      api.post(`/shipments/${id}/orders`, { orderIds }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.shipments.all });
      qc.invalidateQueries({ queryKey: qk.orders.all });
    },
  });
}

// Mirrors models/Shipment.js — keep the two in step.
export const SHIPMENT_STAGES = [
  { key: "ordered",        label: "Ordered with supplier" },
  { key: "production",     label: "In production" },
  { key: "ready_supplier", label: "Ready at supplier" },
  { key: "at_port_origin", label: "At origin port" },
  { key: "in_transit",     label: "In transit" },
  { key: "arrived_port",   label: "Arrived at port" },
  { key: "customs",        label: "Clearing customs" },
  { key: "at_shop",        label: "Received at shop" },
];
