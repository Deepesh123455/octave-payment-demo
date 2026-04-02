import { Request, Response } from "express";
import { IUtilityService } from "../interfaces/utility.interface";

export class UtilityController {
  constructor(private utilityService: IUtilityService) {}

  async getAllUtilities(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as string | undefined;

      const result = await this.utilityService.getAllUtilities(page, limit, status);
      res.status(200).json({
        success: true,
        meta: result.meta,
        data: result.data,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to fetch utilities",
      });
    }
  }

  async approveUtilities(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: "Please provide an array of utility bill IDs to approve",
        });
        return;
      }

      await this.utilityService.approveUtilities(ids);
      res.status(200).json({
        success: true,
        message: "Utility bills approved successfully",
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to approve utility bills",
      });
    }
  }

  async rejectUtilities(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: "Please provide an array of utility bill IDs to reject",
        });
        return;
      }

      await this.utilityService.rejectUtilities(ids);
      res.status(200).json({
        success: true,
        message: "Utility bills rejected successfully",
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to reject utility bills",
      });
    }
  }
}
