import { api } from "./api.auth";

export interface Transaction {
  id: string;
  sourceType: "RENT" | "UTILITY" | "PETTY_CASH";
  storeId: string;
  storeName: string;
  ownerName: string;
  amount: number;
  date: string;
  transactionId: string;
  category: string;
  description: string;
}

export const getTransactions = async (page: number = 1, limit: number = 50): Promise<{ data: Transaction[]; meta?: any }> => {
  const response = await api.get(`/transactions?page=${page}&limit=${limit}`);
  return response.data;
};
