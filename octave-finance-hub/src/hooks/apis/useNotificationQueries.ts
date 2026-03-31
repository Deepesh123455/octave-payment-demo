import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUnreadNotifications, fetchNotificationCounts, markNotificationsRead } from "@/api/api.notification";

export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchUnreadNotifications,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useNotificationCounts = () => {
  return useQuery({
    queryKey: ["notification-counts"],
    queryFn: fetchNotificationCounts,
    refetchInterval: 30000,
  });
};

export const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
    },
  });
};
