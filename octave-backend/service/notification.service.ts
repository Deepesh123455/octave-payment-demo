import { NotificationRepository } from "../repository/notification.repository";
import { Notification } from "@prisma/client";

export class NotificationService {
  constructor(private notificationRepo: NotificationRepository) {}

  async getUnreadNotifications(): Promise<Notification[]> {
    return this.notificationRepo.getUnreadNotifications();
  }

  async getUnreadCounts() {
    return this.notificationRepo.getUnreadCounts();
  }

  async markAsRead(ids: string[]): Promise<void> {
    await this.notificationRepo.markAsRead(ids);
  }

  async markTypeAsRead(type: string): Promise<void> {
    await this.notificationRepo.markTypeAsRead(type);
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
    return this.notificationRepo.createNotification(data);
  }
}
