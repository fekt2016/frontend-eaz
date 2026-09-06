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
    // `date` matters: a stage is usually entered after the fact ("it actually
    // sailed on Monday"), and the customer's timeline shows when things happened,
    // not when staff got round to clicking. Sending the stage the batch is
    // already on corrects that stage's date or note rather than moving it.
    mutationFn: ({ id, stage, note, date }) =>
      api.patch(`/shipments/${id}/stage`, { stage, note, date }).then((r) => r.data),
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
  { key: "production",          label: "In production" },
  { key: "container_warehouse", label: "At the container warehouse" },
  { key: "shipped",             label: "Shipped" },
  { key: "port_ghana",          label: "Arrived at the port in Ghana" },
  { key: "at_shop",             label: "Arrived at our warehouse" },
];

/**
 * What each stage says to the customer — the model's CUSTOMER_STAGES wording,
 * mirrored here so the batch list can show staff exactly what their own update
 * told the customer. Keep the two in step.
 *
 * The order page does not use this: there the server labels each entry, which is
 * the authority. This is for the raw `stageHistory` the shipments list returns.
 */
export const CUSTOMER_LABEL_FOR = {
  production:          "In production",
  container_warehouse: "At the container warehouse",
  shipped:             "Shipped — on its way to Ghana",
  port_ghana:          "Arrived at the port in Ghana",
  at_shop:             "At our warehouse — preparing your order",
};
