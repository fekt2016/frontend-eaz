
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Consultation bookings (GET /contacts?type=consultation) — admin.
export function useConsultations(options = {}) {
  return useQuery({
    queryKey: qk.consultations.all,
    queryFn: () => api.get("/contacts?type=consultation").then((r) => r.data ?? []),
    staleTime: 30_000,
    ...options,
  });
}
