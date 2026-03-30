import { useQuery } from "@tanstack/react-query";
import { fetchAllStores, fetchStoreById } from "@/api/api.store";

export const useStores = () => {
  return useQuery({
    queryKey: ["stores"],
    queryFn: fetchAllStores,
  });
};

export const useStoreDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ["stores", id],
    queryFn: () => fetchStoreById(id!),
    enabled: !!id,
  });
};
