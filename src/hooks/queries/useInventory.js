import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Staff POS inventory search (GET /pos/inventory?q=...). Debounce the term in
// the component and pass it here; the query is disabled until there's a term so
// we never fetch the whole inventory or fire on every keystroke.
// `includeProducts`/`retail` widen the search to shop products (e.g. the Sell
// page selling both parts and accessories); they're folded into the query key
// so a parts-only caller (repair jobs) never shares a cache entry with a
// products-included caller (Sell) for the same search term.
export function useInventorySearch(term, options = {}) {
  const { includeProducts, retail, limit = 8, ...queryOptions } = options;
  const q = (term || "").trim();
  const qs = new URLSearchParams({ q, limit: String(limit) });
  if (includeProducts) qs.set("includeProducts", "true");
  if (retail) qs.set("retail", "true");
  return useQuery({
    queryKey: qk.inventory.search(q, { includeProducts: !!includeProducts, retail: !!retail, limit }),
    queryFn: () => api.get(`/pos/inventory?${qs}`).then((r) => r.data ?? []),
    enabled: q.length >= 1,
    staleTime: 10_000, // stock changes — keep fresh
    placeholderData: keepPreviousData, // smooth results while typing
    ...queryOptions,
  });
}

// Paginated inventory list (GET /pos/inventory). Returns { data, total }.
export function useInventory(params = {}, options = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.inventory.list(params),
    queryFn: () =>
      api.get(`/pos/inventory${suffix}`).then((r) => ({ data: r.data ?? [], total: r.total ?? 0 })),
    staleTime: 10_000,
    placeholderData: keepPreviousData,
    ...options,
  });
}
