import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPettyCashRequests,
  createPettyCashRequest,
  approvePettyCashRequests,
  rejectPettyCashRequests,
  processDirectPayment
} from "@/api/api.petty-cash";

export const usePettyCashRequests = (filters?: { storeId?: string; status?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ["pettyCash", filters],
    queryFn: () => fetchPettyCashRequests(filters),
  });
};

export const useCreatePettyCash = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPettyCashRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pettyCash"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useApprovePettyCash = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, approvedBy }: { ids: string[]; approvedBy: string }) =>
      approvePettyCashRequests(ids, approvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pettyCash"] });
      queryClient.invalidateQueries({ queryKey: ["approvedItems"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useRejectPettyCash = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, rejectedBy }: { ids: string[]; rejectedBy: string }) =>
      rejectPettyCashRequests(ids, rejectedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pettyCash"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useProcessDirectPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: processDirectPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pettyCash"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
    },
  });
};
