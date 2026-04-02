import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/api/api.transaction";

export const useTransactions = (page: number = 1, limit: number = 50) => {
  return useQuery({
    queryKey: ["transactions", page, limit],
    queryFn: () => getTransactions(page, limit),
  });
};
