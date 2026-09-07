import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// ── Shipping Settings (singleton) ──────────────────────────────────────────

// Opted out of the app-wide polling default for the same reason as useSettings:
// business-settings re-seeds its form from this data on every identity change,
// so a poll landing mid-edit would discard what the admin was typing.
export function useShippingSettings(options = {}) {
  return useQuery({
    queryKey: qk.shipping.settings,
    queryFn: () => api.get("/admin/shipping/settings").then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: false,
    ...options,
  });
}

export function useUpdateShippingSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.patch("/admin/shipping/settings", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shipping.all }),
  });
}

// ── Neighbourhood distances (Google Maps) ──────────────────────────────────
//
// The list is driven by the city's Location.neighborhoods, so a neighbourhood
// that has never been measured still appears — with distanceKm null — and the
// admin can see exactly which gaps remain.

export function useNeighborhoodDistances(region, city, options = {}) {
  return useQuery({
    queryKey: qk.shipping.distances(region, city),
    queryFn: () =>
      api
        .get(
          `/admin/shipping/distances?region=${encodeURIComponent(region || "")}&city=${encodeURIComponent(city || "")}`,
        )
        .then((r) => r),
    enabled: !!city,
    staleTime: 30_000,
    ...options,
  });
}

/** Measure the unresolved neighbourhoods (or all of them, with force). */
export function useResolveDistances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) =>
      api.post("/admin/shipping/distances/resolve", body).then((r) => r),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shipping.all }),
  });
}

/** Type a distance by hand where Google cannot route to the neighbourhood. */
export function useSetManualDistance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.patch("/admin/shipping/distances", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shipping.all }),
  });
}

// ── Neighbourhoods (A–F distance zones) ────────────────────────────────────
//
// These are the priced delivery areas. Each carries the distance it was zoned
// on, so an assignment can be audited rather than taken on trust.

export function useAdminNeighborhoods(params = {}, options = {}) {
  return useQuery({
    queryKey: qk.shipping.neighborhoods(params),
    queryFn: () => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v != null && v !== "") search.set(k, v);
      });
      const qs = search.toString();
      return api.get(`/admin/neighborhoods${qs ? `?${qs}` : ""}`).then((r) => r.data);
    },
    staleTime: 30_000,
    ...options,
  });
}

/** How many distances are measured vs estimated, and the per-zone counts. */
export function useNeighborhoodCoverage(options = {}) {
  return useQuery({
    queryKey: qk.shipping.neighborhoodCoverage,
    queryFn: () => api.get("/admin/neighborhoods/coverage").then((r) => r.data),
    staleTime: 30_000,
    ...options,
  });
}

export function useCreateNeighborhood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/admin/neighborhoods", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shipping.all }),
  });
}

export function useUpdateNeighborhood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) =>
      api.patch(`/admin/neighborhoods/${id}`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shipping.all }),
  });
}

/** Deactivates rather than deletes — historical orders reference these by id. */
export function useDeactivateNeighborhood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/admin/neighborhoods/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shipping.all }),
  });
}

/** Re-measure one neighbourhood and reassign its zone (overrides respected). */
export function useRecalculateNeighborhood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/admin/neighborhoods/${id}/recalculate`, {}).then((r) => r),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shipping.all }),
  });
}

/** Batch re-measure. Spends money per row, so the server caps it per request. */
export function useRecalculateAllNeighborhoods() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/admin/neighborhoods/recalculate-all", body).then((r) => r),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shipping.all }),
  });
}

// ── Shipping Zones ─────────────────────────────────────────────────────────

export function useShippingZones(options = {}) {
  return useQuery({
    queryKey: qk.shipping.zones,
    queryFn: () => api.get("/admin/shipping/zones").then((r) => r.data),
    staleTime: 60_000,
    ...options,
  });
}

export function useCreateShippingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/admin/shipping/zones", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shipping.zones }),
  });
}

export function useUpdateShippingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/admin/shipping/zones/${id}`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shipping.zones }),
  });
}

export function useDeleteShippingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/admin/shipping/zones/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shipping.zones }),
  });
}

// ── Shipping Tiers ─────────────────────────────────────────────────────────

export function useShippingTiers(options = {}) {
  return useQuery({
    queryKey: qk.shipping.tiers,
    queryFn: () => api.get("/admin/shipping/tiers").then((r) => r.data),
    staleTime: 60_000,
    ...options,
  });
}

// ── Courier Rate (singleton) ───────────────────────────────────────────────

// Opted out for the same reason as useShippingSettings above — business-settings
// seeds its courier-rate form from this, and a poll mid-edit would reset it.
export function useCourierRate(options = {}) {
  return useQuery({
    queryKey: qk.shipping.courierRate,
    queryFn: () => api.get("/admin/shipping/courier-rate").then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: false,
    ...options,
  });
}

export function useUpdateCourierRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.patch("/admin/shipping/courier-rate", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shipping.courierRate }),
  });
}

// ── T80 E2 — Location CRUD (admin) ──────────────────────────────────────────
// Region → city → neighborhood taxonomy. Mutations invalidate the whole
// `locations` prefix so both the admin list and the public cascade refresh.

function useLocationMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.locations.all });
    },
  });
}

export function useAdminLocations(params = {}, options = {}) {
  return useQuery({
    queryKey: [...qk.locations.all, "admin", "list", params],
    queryFn: () => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v != null && v !== "") search.set(k, v);
      });
      const qs = search.toString();
      return api.get(`/admin/locations${qs ? `?${qs}` : ""}`).then((r) => r.data);
    },
    staleTime: 60_000,
    ...options,
  });
}

export function useCreateLocation() {
  return useLocationMutation((body) => api.post("/admin/locations", body).then((r) => r.data));
}

export function useUpdateLocation() {
  return useLocationMutation(({ id, ...body }) =>
    api.patch(`/admin/locations/${id}`, body).then((r) => r.data),
  );
}

export function useDeleteLocation() {
  return useLocationMutation(({ id, hard = false }) =>
    api.delete(`/admin/locations/${id}${hard ? "?hard=true" : ""}`).then((r) => r.data),
  );
}

// ── T80 E2 — PickupLocation CRUD (admin) ────────────────────────────────────
// Warehouse + bus-station rows. Mutations invalidate both the admin list
// AND the public `/pickups` cache so the storefront selector refreshes
// after an admin toggles a station active/inactive.

function usePickupMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pickups"] });
    },
  });
}

export function useAdminPickups(params = {}, options = {}) {
  return useQuery({
    queryKey: ["pickups", "admin", "list", params],
    queryFn: () => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v != null && v !== "") search.set(k, v);
      });
      const qs = search.toString();
      return api.get(`/admin/pickups${qs ? `?${qs}` : ""}`).then((r) => r.data);
    },
    staleTime: 60_000,
    ...options,
  });
}

export function useCreatePickup() {
  return usePickupMutation((body) => api.post("/admin/pickups", body).then((r) => r.data));
}

export function useUpdatePickup() {
  return usePickupMutation(({ id, ...body }) =>
    api.patch(`/admin/pickups/${id}`, body).then((r) => r.data),
  );
}

export function useDeletePickup() {
  return usePickupMutation(({ id, hard = false }) =>
    api.delete(`/admin/pickups/${id}${hard ? "?hard=true" : ""}`).then((r) => r.data),
  );
}
