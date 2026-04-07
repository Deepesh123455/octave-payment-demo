import { Store } from "@prisma/client";

export interface IStoreRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<Store | null>;
  updatePettyCashBalance(id: string, amount: number): Promise<Store>;
}

export interface IStoreService {
  getAllStores(): Promise<any[]>;
  getStoreById(id: string): Promise<Store | null>;
  updatePettyCashBalance(id: string, amount: number): Promise<Store>;
}