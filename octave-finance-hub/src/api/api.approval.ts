import { api } from "./api.auth";

export const fetchApprovedItems = async (page: number = 1, limit: number = 20, storeId?: string, sourceType?: string) => {
  let url = `/approval?page=${page}&limit=${limit}`;
  if (storeId) url += `&storeId=${storeId}`;
  if (sourceType) url += `&sourceType=${sourceType}`;
  const response = await api.get(url);
  return response.data;
};

export const initiateApprovalPayment = async (
  items: Array<{ id: string; sourceType: "RENT" | "UTILITY" | "PETTY_CASH" }>
) => {
  const response = await api.post("/approval/pay", { items });
  return response.data;
};

export const confirmApprovalPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  items: Array<{ id: string; sourceType: "RENT" | "UTILITY" | "PETTY_CASH" }>;
}) => {
  const response = await api.post("/approval/pay/confirm", payload);
  return response.data;
};

export const rejectApprovalItems = async (
  items: Array<{ id: string; sourceType: "RENT" | "UTILITY" | "PETTY_CASH" }>
) => {
  const response = await api.post("/approval/reject", { items });
  return response.data;
};
