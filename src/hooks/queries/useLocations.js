import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// T80 E2 — public Location + Pickup reads for the checkout cascade. These are
// auth-free, rate-limited via the global /api/ limiter. All hooks use
// react-query so the cascading dropdowns don't refetch on every keystroke —
// each region/city combination is cached separately.

/**
 * GET /locations — regions → cities → neighborhoods, grouped for the cascading
 * dropdown. Optional `?region=` and `?inAccraCore=true` filters.
 */
export function useLocations(options = {}) {
  return useQuery({
    queryKey: qk.locations.grouped,
    queryFn: () => api.get("/locations").then((r) => r.data ?? []),
    staleTime: 60_000,
    ...options,
  });
}

/** GET /locations/cities?region=… */
export function useLocationCities(region, options = {}) {
  return useQuery({
    queryKey: qk.locations.cities(region || ""),
    queryFn: () =>
      api.get(`/locations/cities?region=${encodeURIComponent(region || "")}`)
        .then((r) => r.data ?? []),
    enabled: !!region,
    staleTime: 60_000,
    ...options,
  });
}

/**
 * GET /locations/regions — the serviceable regions.
 *
 * The address form drives its Region field from this. It used to be free text,
 * which broke the entire cascade silently: the region lookup is an exact match,
 * so "greater accra" returned zero cities, the city and neighbourhood pickers
 * emptied, `inAccraCore` fell back to false, and checkout offered bus-station
 * pickup (with no stations) instead of delivery.
 */
export function useLocationRegions(options = {}) {
  return useQuery({
    queryKey: ["locations", "regions"],
    queryFn: () => api.get("/locations/regions").then((r) => r.data ?? []),
    staleTime: 300_000,
    ...options,
  });
}

/** GET /locations/neighborhoods?region=…&city=… */
export function useLocationNeighborhoods(region, city, options = {}) {
  return useQuery({
    queryKey: qk.locations.neighborhoods(region || "", city || ""),
    queryFn: () =>
      api.get(
        `/locations/neighborhoods?region=${encodeURIComponent(region || "")}&city=${encodeURIComponent(city || "")}`
      ).then((r) => r.data),
    enabled: !!region && !!city,
    staleTime: 60_000,
    ...options,
  });
}

/**
 * GET /pickups?kind=bus_station&region=…&city=…
 * Returns the bus-station pickup rows the customer can pick from. The
 * region + city filters narrow the list to the destination's options.
 */
export function useBusStations(region, city, options = {}) {
  return useQuery({
    queryKey: qk.pickups.byCity(region || "", city || ""),
    queryFn: () => {
      const params = new URLSearchParams({ kind: "bus_station" });
      if (region) params.set("region", region);
      if (city) params.set("city", city);
      return api.get(`/pickups?${params.toString()}`).then((r) => r.data ?? []);
    },
    enabled: !!region && !!city,
    staleTime: 60_000,
    ...options,
  });
}

/**
 * GET /neighborhoods?city=… — the priced delivery areas.
 *
 * Distinct from useLocationNeighborhoods, which reads Location and returns
 * plain names for the address cascade. These rows carry the `id` that
 * /shipping/quote needs as `neighborhoodId` to resolve a zone precisely
 * instead of falling back to fuzzy name matching.
 */
export function useNeighborhoodOptions(city, options = {}) {
  return useQuery({
    queryKey: ["neighborhoods", "options", city || ""],
    queryFn: () =>
      api
        .get(`/neighborhoods?city=${encodeURIComponent(city || "")}`)
        .then((r) => r.data?.neighborhoods ?? []),
    enabled: !!city,
    staleTime: 300_000,
    ...options,
  });
}
