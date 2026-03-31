import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

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
  const token = localStorage.getItem("octave_token");
  const response = await axios.get(`${API_BASE_URL}/transactions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
