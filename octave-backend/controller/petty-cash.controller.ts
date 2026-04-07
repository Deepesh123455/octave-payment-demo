import { Request, Response, NextFunction } from "express";
import { IPettyCashService } from "../interfaces/petty-cash.interface";
import { ApiError } from "../utils/AppError";

export class PettyCashController {
  constructor(private pettyCashService: IPettyCashService) {}

  getAllRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { storeId, status, page, limit } = req.query;
      const parsedPage = page ? parseInt(page as string, 10) : 1;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 20;

      const result = await this.pettyCashService.getAllRequests({
        storeId: storeId as string,
        status: status as string,
        page: parsedPage,
        limit: parsedLimit
      });
      res.status(200).json({
        status: "success",
        meta: result.meta,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  };

  createRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount, storeId, requestedBy, category, description } = req.body;
      if (!amount || !storeId || !requestedBy || !category || !description) {
        throw new ApiError("Missing required fields for petty cash request", 400);
      }
      const request = await this.pettyCashService.createRequest({
        amount, storeId, requestedBy, category, description
      });
      res.status(201).json({
        status: "success",
        data: request
      });
    } catch (error) {
      next(error);
    }
  };

  approveRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids, approvedBy } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0 || !approvedBy) {
        throw new ApiError("Ids and ApprovedBy are required", 400);
      }
      await this.pettyCashService.approveRequests(ids, approvedBy);
      res.status(200).json({
        status: "success",
        message: "Requests processed successfully"
      });
    } catch (error) {
      next(error);
    }
  };

  rejectRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids, rejectedBy } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0 || !rejectedBy) {
        throw new ApiError("Ids and RejectedBy are required", 400);
      }
      await this.pettyCashService.rejectRequests(ids, rejectedBy);
      res.status(200).json({
        status: "success",
        message: "Requests rejected successfully"
      });
    } catch (error) {
      next(error);
    }
  };

  processDirectPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { storeId, amount, category, description, requestedBy, razorpayPaymentId } = req.body;
      if (!storeId || !amount || !category || !description || !requestedBy || !razorpayPaymentId) {
        throw new ApiError("Missing required fields for direct payment", 400);
      }
      const payment = await this.pettyCashService.processDirectPayment({
        storeId, amount, category, description, requestedBy, razorpayPaymentId
      });
      res.status(200).json({
        status: "success",
        data: payment
      });
    } catch (error) {
      next(error);
    }
  };
}
