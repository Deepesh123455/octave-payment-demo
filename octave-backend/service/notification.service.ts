import { NotificationRepository } from "../repository/notification.repository";
import { Notification } from "@prisma/client";
import { CacheService } from "../utils/cache";

export class NotificationService {
  constructor(private notificationRepo: NotificationRepository) {}

  async getUnreadNotifications(filters?: { role?: string; storeId?: string }): Promise<Notification[]> {
    return CacheService.getOrSet("NOTIFICATION", { type: "unread", ...filters }, () =>
      this.notificationRepo.getUnreadNotifications(filters)
    );
  }

  async getUnreadCounts(filters?: { role?: string; storeId?: string }) {
    return CacheService.getOrSet("NOTIFICATION", { type: "counts", ...filters }, () =>
      this.notificationRepo.getUnreadCounts(filters)
    );
  }

  async markAsRead(ids: string[]): Promise<void> {
    await this.notificationRepo.markAsRead(ids);
    await CacheService.invalidate("NOTIFICATION");
  }

  async markTypeAsRead(type: string, filters?: { role?: string; storeId?: string }): Promise<void> {
    await this.notificationRepo.markTypeAsRead(type, filters);
    await CacheService.invalidate("NOTIFICATION");
  }

  async create(data: {
    storeId: string;
    adminEmail: string;
    title: string;
    message: string;
    type: string;
    rentPaymentId?: string;
    utilityBillId?: string;
    pettyCashId?: string;
  }): Promise<Notification> {
    const result = await this.notificationRepo.createNotification(data);
    await CacheService.invalidate("NOTIFICATION");
    return result;
  }
}
