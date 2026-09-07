import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Site settings (GET /settings) — maintenance mode, schedule, message.
//
// Opted OUT of the app-wide polling default, deliberately. business-settings
// seeds its forms with `useEffect(() => setForm({...data}), [data])`, and a
// refetch hands that effect a new object identity — so a poll landing while an
// admin is halfway through typing a VAT number or a delivery radius would reset
// the form under them. Settings are edited by the same person looking at them;
// there is nothing to learn from polling and a real edit to lose.
//
// Window-focus and reconnect refetches stay on: those only fire when the tab was
// away, which is not when someone is mid-edit.
export function useSettings(options = {}) {
  return useQuery({
    queryKey: qk.settings.all,
    queryFn: () => api.get("/settings").then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: false,
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
