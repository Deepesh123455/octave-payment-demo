import { TransactionRepository, TransactionItem } from "../repository/transaction.repository";

export class TransactionService {
  constructor(private transactionRepo: TransactionRepository) {}

  async getAllTransactions(): Promise<TransactionItem[]> {
    return this.transactionRepo.getAllTransactions();
  }
}
