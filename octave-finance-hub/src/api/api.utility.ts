import { api } from "./api.auth";

export const fetchUtilities = async () => {
  const response = await api.get("/utility");
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
