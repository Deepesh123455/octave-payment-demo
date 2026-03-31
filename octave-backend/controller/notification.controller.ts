import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../service/notification.service";

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  async getUnreadNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await this.notificationService.getUnreadNotifications();
      res.status(200).json({
        status: "success",
        results: notifications.length,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCounts(req: Request, res: Response, next: NextFunction) {
    try {
      const counts = await this.notificationService.getUnreadCounts();
      res.status(200).json({
        status: "success",
        data: counts,
      });
    } catch (error) {
      next(error);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids, type } = req.body;
      if (type) {
        await this.notificationService.markTypeAsRead(type);
      } else if (ids && Array.isArray(ids)) {
        await this.notificationService.markAsRead(ids);
      } else {
        return res.status(400).json({ status: "fail", message: "Missing ids or type" });
      }
      res.status(200).json({
        status: "success",
        message: "Notifications marked as read",
      });
    } catch (error) {
      next(error);
    }
  }
}
