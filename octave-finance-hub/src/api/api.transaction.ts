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

export const getTransactions = async (
  page: number = 1, 
  limit: number = 50, 
  storeId?: string, 
  sourceType?: string
): Promise<{ data: Transaction[]; meta?: any }> => {
  const params = new URLSearchParams({ 
    page: page.toString(), 
    limit: limit.toString() 
  });
  if (storeId) params.append("storeId", storeId);
  if (sourceType) params.append("sourceType", sourceType);
  
  const response = await api.get(`/transactions?${params.toString()}`);
  return response.data;
};
