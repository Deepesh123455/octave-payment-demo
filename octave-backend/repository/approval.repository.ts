import { PrismaClient } from "@prisma/client";
import { IApprovalRepository, ApprovalItem } from "../interfaces/approval.interface";
import { prisma } from "../config/db";

export class ApprovalRepository implements IApprovalRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async getPaginatedApprovedItems(page: number = 1, limit: number = 20, storeId?: string, sourceType?: string): Promise<{ data: ApprovalItem[]; meta: any }> {
    const skip = (page - 1) * limit;

    const dataRaw: any[] = await this.prisma.$queryRaw`
      SELECT * FROM (
        SELECT rp.id, rp."paymentId" as "entityId", rp."storeId", COALESCE(NULLIF(rp."netPayable", 0), NULLIF(rp.amount, 0), s."monthlyRent", 0)::numeric as amount, rp."dueDate", rp.status::text as status, 'RENT' as "sourceType", s."storeName", l."companyName" as "ownerName", rp."paymentMonth" || ' rent payment' as description, rp."updatedAt"
        FROM rent_payments rp
        LEFT JOIN stores s ON rp."storeId" = s."storeId"
        LEFT JOIN landlords l ON rp."landlordId" = l."landlordId"
        WHERE rp.status = 'Approved'
        
        UNION ALL
        
        SELECT ub.id, ub."billId" as "entityId", ub."storeId", ub."billAmount" as amount, ub."dueDate", ub.status::text as status, 'UTILITY' as "sourceType", s."storeName", ub."providerName" as "ownerName", ub."billMonth" || ' utility bill' as description, ub."updatedAt"
        FROM utility_bills ub
        LEFT JOIN stores s ON ub."storeId" = s."storeId"
        WHERE ub.status = 'Approved'

        UNION ALL

        SELECT pcr.id, pcr."requestId" as "entityId", pcr."storeId", pcr.amount, pcr."requestDate" as "dueDate", pcr.status::text as status, 'PETTY_CASH' as "sourceType", s."storeName", pcr."vendorName" as "ownerName", pcr.description, pcr."updatedAt"
        FROM petty_cash_requests pcr
        LEFT JOIN stores s ON pcr."storeId" = s."storeId"
        WHERE pcr.status = 'Approved' OR pcr.status = 'Auto_Approved'
      ) as combined
      WHERE (${storeId || null}::text IS NULL OR combined."storeId" = ${storeId})
        AND (${sourceType || null}::text IS NULL OR combined."sourceType" = ${sourceType})
      ORDER BY combined."updatedAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countRaw: any[] = await this.prisma.$queryRaw`
      SELECT 
        SUM(CASE WHEN "sourceType" = 'RENT' THEN 1 ELSE 0 END) as rent_count,
        SUM(CASE WHEN "sourceType" = 'UTILITY' THEN 1 ELSE 0 END) as utility_count,
        SUM(CASE WHEN "sourceType" = 'PETTY_CASH' THEN 1 ELSE 0 END) as petty_cash_count,
        COUNT(*) as total
      FROM (
        SELECT rp."storeId", 'RENT' as "sourceType" FROM rent_payments rp WHERE rp.status = 'Approved'
        UNION ALL
        SELECT ub."storeId", 'UTILITY' as "sourceType" FROM utility_bills ub WHERE ub.status = 'Approved'
        UNION ALL
        SELECT pcr."storeId", 'PETTY_CASH' as "sourceType" FROM petty_cash_requests pcr WHERE pcr.status = 'Approved' OR pcr.status = 'Auto_Approved'
      ) as combined
      WHERE (${storeId || null}::text IS NULL OR combined."storeId" = ${storeId})
    `;

    const metaCounts = {
      RENT: Number(countRaw[0]?.rent_count || 0),
      UTILITY: Number(countRaw[0]?.utility_count || 0),
      PETTY_CASH: Number(countRaw[0]?.petty_cash_count || 0),
    };
    const total = Number(countRaw[0]?.total || 0);

    const mappedData: ApprovalItem[] = dataRaw.map((row) => ({
      id: row.entityId,
      sourceType: row.sourceType,
      storeId: row.storeId,
      storeName: row.storeName || "Unknown Store",
      ownerName: row.ownerName || (row.sourceType === "UTILITY" ? "Utility Provider" : "Vendor"),
      amount: Number(row.amount),
      dueDate: row.dueDate, 
      status: row.status,
      category: row.sourceType === "RENT" ? "Rent" : row.sourceType === "UTILITY" ? "Utility" : "Petty Cash",
      description: row.description
    }));

    return {
      data: mappedData,
      meta: {
        totalRecords: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
        counts: metaCounts
      }
    };
  }

  async rejectRentPayments(ids: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE rent_payments
      SET status = 'Rejected'::"PaymentStatus"
      WHERE (id::text = ANY(${ids}) OR "paymentId" = ANY(${ids}))
      AND status = 'Approved'::"PaymentStatus"
    `;
  }

  async rejectUtilityBills(ids: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE utility_bills
      SET status = 'Rejected'::"PaymentStatus"
      WHERE (id::text = ANY(${ids}) OR "billId" = ANY(${ids}))
      AND status = 'Approved'::"PaymentStatus"
    `;
  }

  async rejectPettyCash(ids: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE petty_cash_requests
      SET status = 'Rejected'::"PettyCashStatus"
      WHERE (id::text = ANY(${ids}) OR "requestId" = ANY(${ids}))
      AND (status = 'Approved'::"PettyCashStatus" OR status = 'Auto_Approved'::"PettyCashStatus")
    `;
  }

  async markRentAsPaid(ids: string[], utr: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE rent_payments
      SET status = 'Paid'::"PaymentStatus",
          "paymentDate" = NOW(),
          "utrReference" = ${utr},
          "totalPaid" = "netPayable",
          "paymentMode" = 'Bank_Transfer'::"PaymentMode"
      WHERE (id::text = ANY(${ids}) OR "paymentId" = ANY(${ids}))
    `;
  }

  async markUtilityAsPaid(ids: string[], utr: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE utility_bills
      SET status = 'Paid'::"PaymentStatus",
          "paymentDate" = NOW(),
          "transactionId" = ${utr},
          "paymentMode" = 'Bank_Transfer'::"PaymentMode"
      WHERE (id::text = ANY(${ids}) OR "billId" = ANY(${ids}))
    `;
  }

  async markPettyCashAsPaid(ids: string[], utr: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE petty_cash_requests
      SET status = 'Paid'::"PettyCashStatus",
          "paymentDate" = NOW(),
          "transactionId" = ${utr},
          "paymentMode" = 'Bank_Transfer'::"PaymentMode"
      WHERE (id::text = ANY(${ids}) OR "requestId" = ANY(${ids}))
    `;
  }

  async getRentPaymentsByIds(ids: string[]): Promise<any[]> {
    return this.prisma.rentPayment.findMany({
      where: {
        OR: [
          { id: { in: ids } },
          { paymentId: { in: ids } }
        ]
      }
    });
  }

  async getUtilityBillsByIds(ids: string[]): Promise<any[]> {
    return this.prisma.utilityBill.findMany({
      where: {
        OR: [
          { id: { in: ids } },
          { billId: { in: ids } }
        ]
      }
    });
  }

  async getPettyCashByIds(ids: string[]): Promise<any[]> {
    return this.prisma.pettyCashRequest.findMany({
      where: {
        OR: [
          { id: { in: ids } },
          { requestId: { in: ids } }
        ]
      }
    });
  }
}
