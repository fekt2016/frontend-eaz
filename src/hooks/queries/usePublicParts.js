import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Public repair-parts catalogue (GET /track/parts) — real inventory with name,
// sku, price (pesewas), stock, compatibility, description and images. Cost is
// never exposed by this endpoint. Debounce the query term in the component.
export function usePublicParts(params = {}, options = {}) {
  const qs = new URLSearchParams();
  if (params.q && params.q.trim()) qs.set("q", params.q.trim());
  if (params.category && params.category !== "all") qs.set("category", params.category);
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.parts.search(params),
    queryFn: () => api.get(`/track/parts${suffix}`).then((r) => r.data ?? []),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
    ...options,
  });
}
