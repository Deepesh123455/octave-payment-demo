import { Store } from "@prisma/client";
import { IStoreRepository, IStoreService } from "../interfaces/store.interface";
import { CacheService } from "../utils/cache";

export class StoreService implements IStoreService {
  constructor(private storeRepo: IStoreRepository) {}

  async getAllStores(): Promise<any[]> {
    return CacheService.getOrSet("STORE", { all: true }, () =>
      this.storeRepo.findAll()
    );
  }

  async getStoreById(id: string): Promise<Store | null> {
    return CacheService.getOrSet("STORE", { id }, () =>
      this.storeRepo.findById(id)
    );
  }
}