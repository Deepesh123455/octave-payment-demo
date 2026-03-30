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
      SELECT rp.*, 
             s."storeName",
             l."companyName"
      FROM rent_payments rp
      LEFT JOIN stores s ON rp."storeId" = s."storeId"
      LEFT JOIN landlords l ON rp."landlordId" = l.id
      WHERE rp.status = 'Approved'
      ORDER BY rp."dueDate" ASC
    `;
  }

  async getApprovedUtilityBills(): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT ub.*,
             s."storeName"
      FROM utility_bills ub
      LEFT JOIN stores s ON ub."storeId" = s."storeId"
      WHERE ub.status = 'Approved'
      ORDER BY ub."dueDate" ASC
    `;
  }

  async getApprovedPettyCash(): Promise<any[]> {
    return this.prisma.$queryRaw`
      SELECT pcr.*,
             s."storeName"
      FROM petty_cash_requests pcr
      LEFT JOIN stores s ON pcr."storeId" = s."storeId"
      WHERE pcr.status = 'Approved' OR pcr.status = 'Auto_Approved'
      ORDER BY pcr."requestDate" ASC
    `;
  }

  async rejectRentPayments(ids: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE rent_payments
      SET status = 'Pending'
      WHERE id::text = ANY(${ids})
      AND status = 'Approved'
    `;
  }

  async rejectUtilityBills(ids: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE utility_bills
      SET status = 'Pending'
      WHERE id::text = ANY(${ids})
      AND status = 'Approved'
    `;
  }

  async rejectPettyCash(ids: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE petty_cash_requests
      SET status = 'Pending'
      WHERE id::text = ANY(${ids})
      AND (status = 'Approved' OR status = 'Auto_Approved')
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
      WHERE id::text = ANY(${ids})
    `;
  }

  async markUtilityAsPaid(ids: string[], utr: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE utility_bills
      SET status = 'Paid'::"PaymentStatus",
          "paymentDate" = NOW(),
          "transactionId" = ${utr},
          "paymentMode" = 'Bank_Transfer'::"PaymentMode"
      WHERE id::text = ANY(${ids})
    `;
  }

  async markPettyCashAsPaid(ids: string[], utr: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE petty_cash_requests
      SET status = 'Paid'::"PettyCashStatus",
          "paymentDate" = NOW(),
          "transactionId" = ${utr},
          "paymentMode" = 'Bank_Transfer'::"PaymentMode"
      WHERE id::text = ANY(${ids})
    `;
  }
}
