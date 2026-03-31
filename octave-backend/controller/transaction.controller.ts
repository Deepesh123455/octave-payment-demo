import { Request, Response, NextFunction } from "express";
import { TransactionService } from "../service/transaction.service";

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  async getAllTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const transactions = await this.transactionService.getAllTransactions();
      res.status(200).json({
        status: "success",
        results: transactions.length,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }
}
