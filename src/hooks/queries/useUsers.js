import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// Admin user list — powers the "Actor" dropdown on the Activity Log page.
// Admin + superadmin only (backend-enforced).
//
// Uses ?compact=1, and that is deliberate. GET /auth/users is now paginated
// (25 per page), so the plain call would silently give this dropdown only the
// first page — actors past that would simply not be listed, with nothing to
// show anything was missing. A dropdown needs the COMPLETE set.
//
// compact=1 returns every user projected to { _id, name, email, role }, which
// is what makes completeness affordable: four fields instead of whole user
// documents. This hook is why that mode exists.
export function useUsers(options = {}) {
  return useQuery({
    queryKey: qk.users.all,
    queryFn: async () => {
      const res = await api.get("/auth/users?compact=1");
      return res.data?.users ?? [];
    },
    staleTime: 60_000,
    ...options,
  });
}
