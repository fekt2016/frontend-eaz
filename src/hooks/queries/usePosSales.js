import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Ring up a POS sale (POST /pos/sales). It deducts stock server-side, so on
// success we refresh inventory + parts caches. Body money is already pesewas.
export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/pos/sales", body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["parts"] });
    },
  });
}
