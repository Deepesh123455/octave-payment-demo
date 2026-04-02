import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/api/api.transaction";

export const useTransactions = (page: number = 1, limit: number = 20, storeId?: string, sourceType?: string) => {
  return useQuery({
    queryKey: ["transactions", page, limit, storeId, sourceType],
    queryFn: () => getTransactions(page, limit, storeId, sourceType),
  });
};
