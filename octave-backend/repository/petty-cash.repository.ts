import { PrismaClient } from "@prisma/client";
import { IPettyCashRepository } from "../interfaces/petty-cash.interface";
import { prisma } from "../config/db";

export class PettyCashRepository implements IPettyCashRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  private getResolvedManagerName(item: any) {
    if (
      item?.storeId === "STO001" &&
      item?.store?.managerEmail === "democfo@gmail.com"
    ) {
      return "Rajesh Malhotra";
    }

    return item?.store?.managerName;
  }

  async findAll(filters?: { storeId?: string; status?: string; page?: number; limit?: number }): Promise<{ data: any[]; meta: any }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.storeId) where.storeId = filters.storeId;
    if (filters?.status && filters.status !== "All") {
      if (filters.status === "Pending" || filters.status === "Pending_CFO") {
        where.status = { in: ["Pending", "Pending_CFO"] };
      } else if (filters.status === "Paid") {
        // Treat "Paid" as any petty cash item already deducted/recorded from the card,
        // even if admin approval is still pending.
        where.paymentDate = { not: null };
      } else {
        where.status = filters.status;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.pettyCashRequest.findMany({
        where,
        select: {
          id: true,
          requestId: true,
          storeId: true,
          requestedBy: true,
          requestDate: true,
          amount: true,
          category: true,
          description: true,
          status: true,
          store: { select: { storeName: true, managerName: true, managerEmail: true } }
        },
        orderBy: { requestDate: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.pettyCashRequest.count({ where })
    ]);

    const normalizedData = data.map((item: any) => {
      const requestedBy = item.requestedBy;
      const shouldUseStoreManagerName =
        !requestedBy ||
        requestedBy === "Unknown Manager" ||
        requestedBy === "Store Manager" ||
        requestedBy === "Demo Manager";

      return {
        ...item,
        requestedBy: shouldUseStoreManagerName
          ? this.getResolvedManagerName(item) || requestedBy || "Store Manager"
          : requestedBy,
      };
    });

    return {
      data: normalizedData,
      meta: {
        totalRecords: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    };
  }

  async create(data: any): Promise<any> {
    const { requestId, storeId, requestedBy, amount, category, description, status } = data;
    
    // Using raw SQL for create to ensure status enum is handled correctly
    await this.prisma.$executeRaw`
      INSERT INTO petty_cash_requests (
        id, "requestId", "storeId", "requestedBy", "requestDate", amount, category, description, status, "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), ${requestId}, ${storeId}, ${requestedBy}, NOW(), ${amount}, ${category}, ${description}, ${status}::"PettyCashStatus", NOW(), NOW()
      )
    `;
    
    const [result]: any[] = await this.prisma.$queryRaw`
      SELECT * FROM petty_cash_requests WHERE "requestId" = ${requestId} LIMIT 1
    `;
    return result;
  }

  async bulkApprove(ids: string[], approvedBy: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE petty_cash_requests
      SET status = 'Approved'::"PettyCashStatus",
          "approvedBy" = ${approvedBy},
          "approvalDate" = NOW(),
          "updatedAt" = NOW()
      WHERE (id::text = ANY(${ids}) OR "requestId" = ANY(${ids}))
      AND (status = 'Pending' OR status = 'Pending_CFO' OR status = 'Escalated' OR status = 'Rejected')
    `;
  }

  async findByIds(ids: string[]): Promise<any[]> {
    return this.prisma.pettyCashRequest.findMany({
      where: {
        id: { in: ids }
      }
    });
  }

  async updateStatus(ids: string[], status: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE petty_cash_requests
      SET status = ${status}::"PettyCashStatus",
          "updatedAt" = NOW()
      WHERE (id::text = ANY(${ids}) OR "requestId" = ANY(${ids}))
    `;
  }

  async processDirectPayment(data: { storeId: string; amount: number; category: string; description: string; requestedBy: string; razorpayPaymentId: string }): Promise<any> {
    const { storeId, amount, category, description, requestedBy, razorpayPaymentId } = data;
    const requestId = `PETTY-${Date.now()}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Deduct from store balance using raw SQL (avoids stale Prisma client type mismatch)
      await tx.$executeRaw`
        UPDATE stores 
        SET "pettyCashBalance" = "pettyCashBalance" - ${amount}, "updatedAt" = NOW()
        WHERE "storeId" = ${storeId}
      `;

      // 2. Determine status based on threshold (1500)
      const status = amount > 1500 ? 'Pending' : 'Auto_Approved';
      const remarks = `Card Payment (Razorpay ID: ${razorpayPaymentId})${status === 'Pending' ? ' - Awaiting Admin Approval' : ' - Auto Verified'}`;

      // 3. Create petty cash request
      await tx.$executeRaw`
        INSERT INTO petty_cash_requests (
          id, "requestId", "storeId", "requestedBy", "requestDate", "paymentDate", amount, category, description, status, "remarks", "vendorName", "transactionId", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), ${requestId}, ${storeId}, ${requestedBy}, NOW(), NOW(), ${amount}, ${category}, ${description}, ${status}::"PettyCashStatus", ${remarks}, 'Razorpay Card', ${razorpayPaymentId}, NOW(), NOW()
        )
      `;

      // 4. Create transaction and approval notifications for both store and admin views.
      const notifications = status === 'Pending'
        ? [
            {
              adminEmail: 'admins',
              title: 'High Value Petty Cash Spend',
              message: `Store Manager ${requestedBy} spent ${amount} for ${category}. Admin approval required.`,
              type: 'PETTY_CASH',
            },
            {
              adminEmail: 'store',
              title: 'Approval Required',
              message: 'Amount more than ₹1,500 requires approval. The money has been deducted.',
              type: 'PETTY_CASH',
            },
            {
              adminEmail: 'store',
              title: 'Transaction Recorded',
              message: `Petty cash spend of ₹${amount} has been recorded and is pending approval.`,
              type: 'TRANSACTION',
            },
            {
              adminEmail: 'admins',
              title: 'Transaction Recorded',
              message: `Petty cash spend of ₹${amount} for ${category} has been recorded and is pending approval.`,
              type: 'TRANSACTION',
            }
          ]
        : [
            {
              adminEmail: 'store',
              title: 'Transaction Recorded',
              message: `Petty cash spend of ₹${amount} was auto-approved and added to transaction history.`,
              type: 'TRANSACTION',
            },
            {
              adminEmail: 'admins',
              title: 'Transaction Recorded',
              message: `Auto-approved petty cash spend of ₹${amount} for ${category} was added to transaction history.`,
              type: 'TRANSACTION',
            }
          ];

      for (const notification of notifications) {
        await tx.$executeRaw`
          INSERT INTO notifications (
            id, "storeId", "adminEmail", title, message, type, "isRead", "sentAt", "pettyCashId", "createdAt"
          ) VALUES (
            gen_random_uuid(), ${storeId}, ${notification.adminEmail}, ${notification.title},
            ${notification.message},
            ${notification.type}, false, NOW(), ${requestId}, NOW()
          )
        `;
      }

      const [result]: any[] = await tx.$queryRaw`
        SELECT * FROM petty_cash_requests WHERE "requestId" = ${requestId} LIMIT 1
      `;
      return result;
    });
  }
}
