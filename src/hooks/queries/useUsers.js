import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Admin user list (GET /auth/users) — used to power the "Actor" dropdown on
// the Activity Log page. Admin + superadmin only (backend-enforced). Returns
// the full user array { _id, name, email, role, phone, ... }.
export function useUsers(options = {}) {
  return useQuery({
    queryKey: qk.users.all,
    queryFn: async () => {
      const res = await api.get("/auth/users");
      return res.data ?? [];
    },
    staleTime: 60_000,
    ...options,
  });
}
