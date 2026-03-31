import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRentPayments, initiatePayment, confirmPayment, approvePayments, rejectPayments } from "@/api/api.rent";

export const useRentPayments = () => {
  return useQuery({
    queryKey: ["rent-payments"],
    queryFn: fetchRentPayments,
  });
};

export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: (paymentIds: string[]) => initiatePayment(paymentIds),
  });
};

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => confirmPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rent-payments"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useApprovePayments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentIds: string[]) => approvePayments(paymentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rent-payments"] });
      queryClient.invalidateQueries({ queryKey: ["approvedItems"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useRejectRentPayments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentIds: string[]) => rejectPayments(paymentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rent-payments"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
