import { api } from "./api.auth";

export const fetchUnreadNotifications = async (filters?: { role?: string; storeId?: string }) => {
  const response = await api.get("notifications", { params: filters });
  return response.data;
};

export const fetchNotificationCounts = async (filters?: { role?: string; storeId?: string }) => {
  const response = await api.get("notifications/counts", { params: filters });
  return response.data;
};

export const markNotificationsRead = async (payload: { ids?: string[]; type?: string; role?: string; storeId?: string }) => {
  const response = await api.post("notifications/mark-read", payload);
  return response.data;
};

export const createRefillRequest = async (payload: { storeId: string; requestedBy: string; storeName?: string }) => {
  const response = await api.post("notifications/refill-request", payload);
  return response.data;
};
