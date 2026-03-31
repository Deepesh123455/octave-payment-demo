import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/api/api.transaction";

export const useTransactions = () => {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });
};
