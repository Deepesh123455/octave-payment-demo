import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchApprovedItems,
  initiateApprovalPayment,
  confirmApprovalPayment,
  rejectApprovalItems,
} from "@/api/api.approval";

export const useApprovedItems = () => {
  return useQuery({
    queryKey: ["approvedItems"],
    queryFn: fetchApprovedItems,
  });
};

export const useInitiateApprovalPayment = () => {
  return useMutation({ mutationFn: initiateApprovalPayment });
};

export const useConfirmApprovalPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmApprovalPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvedItems"] });
      queryClient.invalidateQueries({ queryKey: ["rent-payments"] });
      queryClient.invalidateQueries({ queryKey: ["utilityBills"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
};

export const useRejectApprovalItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectApprovalItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvedItems"] });
      queryClient.invalidateQueries({ queryKey: ["rent-payments"] });
      queryClient.invalidateQueries({ queryKey: ["utilityBills"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
