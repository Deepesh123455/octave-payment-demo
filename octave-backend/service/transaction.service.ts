import { TransactionRepository, TransactionItem } from "../repository/transaction.repository";
import { CacheService } from "../utils/cache";

export class TransactionService {
  constructor(private transactionRepo: TransactionRepository) {}

  async getAllTransactions(page: number = 1, limit: number = 50, storeId?: string, sourceType?: string): Promise<{ data: TransactionItem[]; meta: any }> {
    return CacheService.getOrSet("TRANSACTION", { page, limit, storeId, sourceType }, () =>
      this.transactionRepo.getAllTransactions(page, limit, storeId, sourceType)
    );
  }
}
