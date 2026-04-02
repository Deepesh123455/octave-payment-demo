import { Request, Response, NextFunction } from "express";
import { TransactionService } from "../service/transaction.service";

export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  async getAllTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await this.transactionService.getAllTransactions(page, limit);
      res.status(200).json({
        status: "success",
        meta: result.meta,
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }
}
