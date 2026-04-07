import { api } from "./api.auth";

export interface Store {
  id: string;
  storeId: string;
  storeName: string;
  city: string;
  state: string;
  region: string;
  mallOrMarket: string;
  type: "Mall" | "High_Street";
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  zoneManager: string;
  landlordId: string;
  monthlyRent: number;
  rentDueDay: number;
  securityDeposit: number;
  leaseStartDate: string;
  leaseEndDate: string;
  pettyCashLimit: number;
  pettyCashBalance: number;
  virtualCardNumber: string;
  openingDate: string;
  storeStatus: "Active" | "Inactive" | "Under_Renovation";
  squareFeet: number;
  bankAccountLast4: string;
  tallyCostCenter: string;
  createdAt: string;
  updatedAt: string;
  landlord?: any; // Added if included
}

export const fetchAllStores = async () => {
  const response = await api.get("stores");
  return response.data; // Backend returns { status, results, data }
};

export const fetchStoreById = async (id: string) => {
  const response = await api.get(`stores/${id}`);
  return response.data; // Backend returns { status, data }
};

export const updateStorePettyCashBalance = async (id: string, amount: number) => {
  const response = await api.patch(`stores/${id}/petty-cash-balance`, { amount });
  return response.data;
};
