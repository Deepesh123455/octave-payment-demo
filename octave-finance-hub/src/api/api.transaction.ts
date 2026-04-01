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

export const getTransactions = async (): Promise<{ data: Transaction[] }> => {
  const response = await api.get("transactions");
  return response.data;
};
