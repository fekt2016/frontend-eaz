import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Repair jobs for the current user (GET /track/mine). Staff-side roles get every
// job; customers get their own (matched by phone/email server-side).
export function useMyRepairs(options = {}) {
  return useQuery({
    queryKey: qk.repairs.mine,
    queryFn: () => api.get("/track/mine").then((r) => r.data ?? []),
    staleTime: 30_000,
    ...options,
  });
}
