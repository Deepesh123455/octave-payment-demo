import { PrismaClient } from "@prisma/client";
import { IPettyCashRepository } from "../interfaces/petty-cash.interface";
import { prisma } from "../config/db";

export class PettyCashRepository implements IPettyCashRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(filters?: { storeId?: string; status?: string; page?: number; limit?: number }): Promise<{ data: any[]; meta: any }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.storeId) where.storeId = filters.storeId;
    if (filters?.status && filters.status !== "All") where.status = filters.status;

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
          store: { select: { storeName: true } }
        },
        orderBy: { requestDate: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.pettyCashRequest.count({ where })
    ]);

    return {
      data,
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
      AND (status = 'Pending_CFO' OR status = 'Escalated' OR status = 'Rejected')
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
}
