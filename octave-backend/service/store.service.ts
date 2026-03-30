import { Store } from "@prisma/client";
import { IStoreRepository, IStoreService } from "../interfaces/store.interface";

export class StoreService implements IStoreService {
  constructor(private storeRepo: IStoreRepository) {}

  async getAllStores(): Promise<Store[]> {
    return this.storeRepo.findAll();
  }

  async getStoreById(id: string): Promise<Store | null> {
    return this.storeRepo.findById(id);
  }
}