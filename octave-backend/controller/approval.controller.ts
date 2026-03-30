import { Request, Response } from "express";
import { IApprovalService } from "../interfaces/approval.interface";

export class ApprovalController {
  constructor(private approvalService: IApprovalService) {}

  async getApprovedItems(req: Request, res: Response): Promise<void> {
    try {
      const items = await this.approvalService.getApprovedItems();
      res.status(200).json({ success: true, data: items });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch approved items",
      });
    }
  }

  async initiatePayment(req: Request, res: Response): Promise<void> {
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, message: "Please provide items to pay" });
        return;
      }
      const order = await this.approvalService.initiatePayment(items);
      res.status(200).json({ success: true, data: order });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to initiate payment",
      });
    }
  }

  async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      await this.approvalService.confirmPayment(req.body);
      res.status(200).json({ success: true, message: "Payment confirmed successfully" });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Payment verification failed",
      });
    }
  }

  async rejectItems(req: Request, res: Response): Promise<void> {
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, message: "Please provide items to reject" });
        return;
      }
      await this.approvalService.rejectItems(items);
      res.status(200).json({
        success: true,
        message: "Items rejected and returned to Pending status",
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to reject items",
      });
    }
  }
}
