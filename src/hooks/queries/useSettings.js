import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Site settings (GET /settings) — maintenance mode, schedule, message.
export function useSettings(options = {}) {
  return useQuery({
    queryKey: qk.settings.all,
    queryFn: () => api.get("/settings").then((r) => r.data),
    staleTime: 60_000,
    ...options,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.patch("/settings", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.settings.all }),
  });
}
