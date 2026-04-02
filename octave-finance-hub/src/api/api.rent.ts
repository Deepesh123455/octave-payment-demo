import { api } from "./api.auth";

export interface RentPayment {
  id: string;
  paymentId: string;
  storeId: string;
  landlordId: string;
  paymentMonth: string;
  amount: number;
  latePenalty: number;
  totalPaid: number;
  dueDate: string;
  paymentDate: string | null;
  paymentMode: string;
  utrReference: string | null;
  status: "Paid" | "Pending" | "Overdue" | "Pending_Approval" | "Cancelled" | "Rejected";
  tdsDeducted: number;
  gst: number;
  netPayable: number;
  invoiceNumber: string | null;
  remarks: string | null;
  store?: { storeName: string };
  landlord?: { companyName: string };
}

export const fetchRentPayments = async (page: number = 1, limit: number = 50, status?: string) => {
  const params = new URLSearchParams();
  if (page) params.append("page", page.toString());
  if (limit) params.append("limit", limit.toString());
  if (status && status !== "All") params.append("status", status);

  const response = await api.get(`rent?${params.toString()}`);
  return response.data;
};

export const initiatePayment = async (paymentIds: string[]) => {
  const response = await api.post("rent/initiate", { paymentIds });
  return response.data;
};

export const confirmPayment = async (payload: any) => {
  const response = await api.post("rent/confirm", payload);
  return response.data;
};

export const approvePayments = async (paymentIds: string[]) => {
  const response = await api.post("rent/approve", { paymentIds });
  return response.data;
};

export const rejectPayments = async (paymentIds: string[]) => {
  const response = await api.post("rent/reject", { paymentIds });
  return response.data;
};
