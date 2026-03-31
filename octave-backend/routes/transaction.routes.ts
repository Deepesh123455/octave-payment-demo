import { Router } from "express";
import { TransactionController } from "../controller/transaction.controller";
import { TransactionService } from "../service/transaction.service";
import { TransactionRepository } from "../repository/transaction.repository";

const router = Router();

const transactionRepo = new TransactionRepository();
const transactionService = new TransactionService(transactionRepo);
const transactionController = new TransactionController(transactionService);

router.get("/", (req, res, next) => transactionController.getAllTransactions(req, res, next));

export default router;
