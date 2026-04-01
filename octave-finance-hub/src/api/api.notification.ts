import { api } from "./api.auth";

export const fetchUnreadNotifications = async () => {
  const response = await api.get("notifications");
  return response.data;
};

export const fetchNotificationCounts = async () => {
  const response = await api.get("notifications/counts");
  return response.data;
};

export const markNotificationsRead = async (payload: { ids?: string[]; type?: string }) => {
  const response = await api.post("notifications/mark-read", payload);
  return response.data;
};
