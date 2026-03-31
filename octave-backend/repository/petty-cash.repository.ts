import { PrismaClient } from "@prisma/client";
import { IPettyCashRepository } from "../interfaces/petty-cash.interface";
import { prisma } from "../config/db";

export class PettyCashRepository implements IPettyCashRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(filters?: { storeId?: string; status?: string }): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT pcr.*, 
             s."storeName"
      FROM petty_cash_requests pcr
      LEFT JOIN stores s ON pcr."storeId" = s."storeId"
      WHERE (${filters?.storeId ? true : false} = false OR pcr."storeId" = ${filters?.storeId})
      AND (${filters?.status ? true : false} = false OR pcr.status::text = ${filters?.status})
      ORDER BY pcr."requestDate" DESC
    `;
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
      WHERE id::text = ANY(${ids})
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
      WHERE id::text = ANY(${ids})
    `;
  }
}
