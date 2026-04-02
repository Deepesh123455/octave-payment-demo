import { api } from "./api.auth";

export const fetchPettyCashRequests = async (filters?: { storeId?: string; status?: string; page?: number; limit?: number }) => {
  const params: any = { ...filters };
  if (params.status === "All") delete params.status;
  const response = await api.get("/petty-cash", { params });
  return response.data;
};

export const createPettyCashRequest = async (data: any) => {
  const response = await api.post("/petty-cash", data);
  return response.data;
};

export const approvePettyCashRequests = async (ids: string[], approvedBy: string) => {
  const response = await api.post("/petty-cash/approve", { ids, approvedBy });
  return response.data;
};

export const rejectPettyCashRequests = async (ids: string[], rejectedBy: string) => {
  const response = await api.post("/petty-cash/reject", { ids, rejectedBy });
  return response.data;
};
