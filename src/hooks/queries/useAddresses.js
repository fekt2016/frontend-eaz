import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

// The customer's saved delivery addresses (/api/v1/addresses). Every route is
// scoped server-side to the logged-in user, so none of these hooks takes a user
// id — there is nothing to pass and nothing a client could spoof.
//
// The API returns the list default-first, then most recently touched; that is
// the order both the address book and the checkout picker render, so nothing
// re-sorts it here.

/** GET /addresses — the whole address book. */
export function useAddresses(options = {}) {
  return useQuery({
    queryKey: qk.addresses.list,
    queryFn: () => api.get("/addresses").then((r) => r.data ?? []),
    staleTime: 30_000,
    ...options,
  });
}

/** POST /addresses */
export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/addresses", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.addresses.all }),
  });
}

/**
 * PATCH /addresses/:id — a true partial, so passing `{ label }` renames the
 * address without touching the street it points at.
 */
export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/addresses/${id}`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.addresses.all }),
  });
}

/** PATCH /addresses/:id/default — promotes one and demotes the rest. */
export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    // `{}` rather than no body: the wrapper JSON-stringifies whatever it gets,
    // and a body-less PATCH still carries an application/json content type.
    mutationFn: (id) => api.patch(`/addresses/${id}/default`, {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.addresses.all }),
  });
}

/** DELETE /addresses/:id — deleting the default promotes a survivor. */
export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/addresses/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.addresses.all }),
  });
}
