import { PrismaClient, Notification } from "@prisma/client";
import { prisma } from "../config/db";

export interface NotificationCount {
  type: string;
  count: number;
}

export class NotificationRepository {
  private prisma: PrismaClient;

  constructor(prismaInstance?: PrismaClient) {
    this.prisma = prismaInstance || prisma;
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { isRead: false },
      orderBy: { sentAt: "desc" },
      include: {
        store: { select: { storeName: true } }
      }
    });
  }

  async getUnreadCounts(): Promise<NotificationCount[]> {
    const counts = await this.prisma.notification.groupBy({
      by: ["type"],
      where: { isRead: false },
      _count: { _all: true }
    });

    return counts.map((c) => ({
      type: c.type,
      count: c._count._all
    }));
  }

  async markAsRead(ids: string[]): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { isRead: true }
    });
  }

  async markTypeAsRead(type: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { type, isRead: false },
      data: { isRead: true }
    });
  }

  async createNotification(data: {
    storeId: string;
    adminEmail: string;
    title: string;
    message: string;
    type: string;
    rentPaymentId?: string;
    utilityBillId?: string;
    pettyCashId?: string;
  }): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        ...data,
        isRead: false,
        sentAt: new Date()
      }
    });
  }

  async createManyNotifications(data: Array<{
    storeId: string;
    adminEmail: string;
    title: string;
    message: string;
    type: string;
    rentPaymentId?: string;
    utilityBillId?: string;
    pettyCashId?: string;
  }>): Promise<void> {
    if (data.length === 0) return;
    await this.prisma.notification.createMany({
      data: data.map(d => ({
        ...d,
        isRead: false,
        sentAt: new Date()
      }))
    });
  }
}
