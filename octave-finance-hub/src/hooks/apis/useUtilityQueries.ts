import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUtilities, approveUtilities, rejectUtilities } from "@/api/api.utility";

export const useUtilityBills = () => {
  return useQuery({
    queryKey: ["utilityBills"],
    queryFn: fetchUtilities,
  });
};

export const useApproveUtilities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveUtilities,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utilityBills"] });
      // Also invalidate store details if needed
      queryClient.invalidateQueries({ queryKey: ["store"] });
    },
  });
};

export const useRejectUtilities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectUtilities,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utilityBills"] });
      queryClient.invalidateQueries({ queryKey: ["store"] });
    },
  });
};
