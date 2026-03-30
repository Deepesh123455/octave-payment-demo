import { Store } from "@prisma/client";

export interface IStoreRepository {
  findAll(): Promise<Store[]>;
  findById(id: string): Promise<Store | null>;
}

export interface IStoreService {
  getAllStores(): Promise<Store[]>;
  getStoreById(id: string): Promise<Store | null>;
}