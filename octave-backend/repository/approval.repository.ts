import { PrismaClient } from "@prisma/client";
import { IApprovalRepository } from "../interfaces/approval.interface";
import { prisma } from "../config/db";

export class ApprovalRepository implements IApprovalRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async getApprovedRentPayments(): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT rp.id, rp."paymentId", rp."storeId", rp."landlordId", 
             rp."paymentMonth", rp.amount, rp."netPayable", rp."dueDate", rp.status,
             s."storeName",
             l."companyName"
      FROM rent_payments rp
      LEFT JOIN stores s ON rp."storeId" = s."storeId"
      LEFT JOIN landlords l ON rp."landlordId" = l."landlordId"
      WHERE rp.status = 'Approved'
      ORDER BY rp."dueDate" DESC
    `;
  }

  async getApprovedUtilityBills(): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT ub.id, ub."billId", ub."storeId", ub."utilityType", 
             ub."providerName", ub."billMonth", ub."billAmount", 
             ub."dueDate", ub.status,
             s."storeName"
      FROM utility_bills ub
      LEFT JOIN stores s ON ub."storeId" = s."storeId"
      WHERE ub.status = 'Approved'
      ORDER BY ub."dueDate" DESC
    `;
  }

  async getApprovedPettyCash(): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT pcr.id, pcr."requestId", pcr."storeId", pcr."requestedBy", 
             pcr."requestDate", pcr.amount, pcr.category, pcr.description, 
             pcr.status,
             s."storeName"
      FROM petty_cash_requests pcr
      LEFT JOIN stores s ON pcr."storeId" = s."storeId"
      WHERE pcr.status = 'Approved' OR pcr.status = 'Auto_Approved'
      ORDER BY pcr."requestDate" DESC
    `;
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
