import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUnreadNotifications, fetchNotificationCounts, markNotificationsRead } from "@/api/api.notification";
import { useAuth } from "@/contexts/AuthContext";

export const useNotifications = () => {
  const { user } = useAuth();
  const filters = {
    role: user?.role,
    storeId: user?.role === "STORE_MANAGER" ? user?.storeId || "STO001" : undefined,
  };

  return useQuery({
    queryKey: ["notifications", filters.role, filters.storeId],
    queryFn: () => fetchUnreadNotifications(filters),
    refetchInterval: 5000,
  });
};

export const useNotificationCounts = () => {
  const { user } = useAuth();
  const filters = {
    role: user?.role,
    storeId: user?.role === "STORE_MANAGER" ? user?.storeId || "STO001" : undefined,
  };

  return useQuery({
    queryKey: ["notification-counts", filters.role, filters.storeId],
    queryFn: () => fetchNotificationCounts(filters),
    refetchInterval: 5000,
  });
};

export const useMarkRead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { ids?: string[]; type?: string }) =>
      markNotificationsRead({
        ...payload,
        role: user?.role,
        storeId: user?.role === "STORE_MANAGER" ? user?.storeId || "STO001" : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-counts"] });
    },
  });
};
