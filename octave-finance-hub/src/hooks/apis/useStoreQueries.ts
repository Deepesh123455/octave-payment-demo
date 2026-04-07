import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllStores, fetchStoreById, updateStorePettyCashBalance } from "@/api/api.store";

export const useStores = () => {
  return useQuery({
    queryKey: ["stores"],
    queryFn: fetchAllStores,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });
};

export const useStoreDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ["stores", id],
    queryFn: () => fetchStoreById(id!),
    enabled: !!id,
  });
};

export const useUpdateStoreBalance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => 
      updateStorePettyCashBalance(id, amount),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["pettyCash"] });
    },
  });
};
