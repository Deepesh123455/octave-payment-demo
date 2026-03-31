import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const fetchUnreadNotifications = async () => {
  const response = await axios.get(`${API_URL}/notifications`, {
    withCredentials: true,
  });
  return response.data;
};

export const fetchNotificationCounts = async () => {
  const response = await axios.get(`${API_URL}/notifications/counts`, {
    withCredentials: true,
  });
  return response.data;
};

export const markNotificationsRead = async (payload: { ids?: string[]; type?: string }) => {
  const response = await axios.post(`${API_URL}/notifications/mark-read`, payload, {
    withCredentials: true,
  });
  return response.data;
};
