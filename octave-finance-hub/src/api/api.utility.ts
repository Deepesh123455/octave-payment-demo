import { api } from "./api.auth";

export const fetchUtilities = async (page: number = 1, limit: number = 50, status?: string) => {
  const params = new URLSearchParams();
  if (page) params.append("page", page.toString());
  if (limit) params.append("limit", limit.toString());
  if (status && status !== "All") params.append("status", status);

  const response = await api.get(`/utility?${params.toString()}`);
  return response.data;
};

export const approveUtilities = async (ids: string[]) => {
  const response = await api.post("/utility/approve", { ids });
  return response.data;
};

export const rejectUtilities = async (ids: string[]) => {
  const response = await api.post("/utility/reject", { ids });
  return response.data;
};
