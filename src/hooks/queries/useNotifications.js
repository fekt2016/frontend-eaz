import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Cheap poll target for the bell badge (T12). 30s matches this app's global
// staleTime default — responsive enough for "a job just got assigned to me"
// without hammering the API; the query auto-pauses while the tab is hidden
// (react-query's refetchIntervalInBackground defaults to false).
export function useUnreadNotificationCount(options = {}) {
  return useQuery({
    queryKey: qk.notifications.unreadCount,
    queryFn: () => api.get("/notifications/unread-count").then((r) => r.data?.count ?? 0),
    refetchInterval: 30_000,
    ...options,
  });
}

// Paginated notification list (GET /notifications). Returns { data, total, page, limit }.
export function useNotifications(params = {}, options = {}) {
  const qs = new URLSearchParams();
  if (params.unreadOnly) qs.set("unreadOnly", "true");
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: qk.notifications.list(params),
    queryFn: () =>
      api.get(`/notifications${suffix}`).then((r) => ({ data: r.data ?? [], total: r.total ?? 0 })),
    staleTime: 10_000,
    ...options,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`, {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/notifications/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications.all }),
  });
}
