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
      queryClient.invalidateQueries({ queryKey: ["approvedItems"] });
      queryClient.invalidateQueries({ queryKey: ["store"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
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
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
