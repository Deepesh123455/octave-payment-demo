import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUtilities, approveUtilities, rejectUtilities } from "@/api/api.utility";

export const useUtilityBills = (page: number = 1, limit: number = 50, status?: string) => {
  return useQuery({
    queryKey: ["utilityBills", page, limit, status],
    queryFn: () => fetchUtilities(page, limit, status),
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
