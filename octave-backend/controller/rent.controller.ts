import { Request, Response, NextFunction } from "express";
import { IRentService } from "../interfaces/rent.interface";
import { ApiError } from "../utils/AppError";

export class RentController {
  constructor(private rentService: IRentService) {}

  getRentPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payments = await this.rentService.getAllRentPayments();
      res.status(200).json({
        status: "success",
        results: payments.length,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  };

  initiatePayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentIds } = req.body;
      if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
        throw new ApiError("Please provide an array of payment IDs", 400);
      }

      const order = await this.rentService.createRazorpayOrder(paymentIds);
      res.status(200).json({
        status: "success",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentIds } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentIds) {
        throw new ApiError("Missing required payment verification fields", 400);
      }

      await this.rentService.verifyPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        paymentIds
      });

      res.status(200).json({
        status: "success",
        message: "Payment verified and records updated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  approvePayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentIds } = req.body;
      if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
        throw new ApiError("Please provide an array of payment IDs", 400);
      }

      await this.rentService.approvePayments(paymentIds);
      res.status(200).json({
        status: "success",
        message: "Payments approved and moved to Pending Approval status",
      });
    } catch (error) {
      next(error);
    }
  };

  rejectPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentIds } = req.body;
      if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
        throw new ApiError("Please provide an array of payment IDs", 400);
      }

      await this.rentService.rejectPayments(paymentIds);
      res.status(200).json({
        status: "success",
        message: "Payments rejected",
      });
    } catch (error) {
      next(error);
    }
  };
}
