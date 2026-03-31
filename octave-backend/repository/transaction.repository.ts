import { PrismaClient } from "@prisma/client";
import { prisma } from "../config/db";

export interface TransactionItem {
  id: string;
  sourceType: "RENT" | "UTILITY" | "PETTY_CASH";
  storeId: string;
  storeName: string;
  ownerName: string; // Landlord or Vendor
  amount: number;
  date: Date;
  transactionId: string; // utrReference or transactionId
  category: string;
  description: string;
}

export class TransactionRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async getAllTransactions(): Promise<TransactionItem[]> {
    const [rentPayments, utilityBills, pettyCashRequests] = await Promise.all([
      this.prisma.$queryRaw`
        SELECT rp.*, 
               s."storeName",
               l."companyName" as "ownerName"
        FROM rent_payments rp
        LEFT JOIN stores s ON rp."storeId" = s."storeId"
        LEFT JOIN landlords l ON rp."landlordId" = l.id
        WHERE rp.status = 'Paid'
        ORDER BY rp."paymentDate" DESC
      `,
      this.prisma.$queryRaw`
        SELECT ub.*,
               s."storeName"
        FROM utility_bills ub
        LEFT JOIN stores s ON ub."storeId" = s."storeId"
        WHERE ub.status = 'Paid'
        ORDER BY ub."paymentDate" DESC
      `,
      this.prisma.$queryRaw`
        SELECT pcr.*,
               s."storeName"
        FROM petty_cash_requests pcr
        LEFT JOIN stores s ON pcr."storeId" = s."storeId"
        WHERE pcr.status = 'Paid'
        ORDER BY pcr."paymentDate" DESC
      `
    ]);

    const rentItems: TransactionItem[] = (rentPayments as any[]).map((r) => ({
      id: r.id,
      sourceType: "RENT",
      storeId: r.storeId,
      storeName: r.storeName || "Unknown Store",
      ownerName: r.ownerName || "Unknown Owner",
      amount: Number(r.totalPaid) || Number(r.amount),
      date: r.paymentDate,
      transactionId: r.utrReference || "N/A",
      category: "Rent",
      description: `${r.paymentMonth} rent payment`
    }));

    const utilityItems: TransactionItem[] = (utilityBills as any[]).map((u) => ({
      id: u.id,
      sourceType: "UTILITY",
      storeId: u.storeId,
      storeName: u.storeName || "Unknown Store",
      ownerName: u.providerName || "Utility Provider",
      amount: Number(u.billAmount),
      date: u.paymentDate,
      transactionId: u.transactionId || "N/A",
      category: u.utilityType,
      description: `${u.billMonth} ${u.utilityType.toLowerCase()} bill`
    }));

    const pettyCashItems: TransactionItem[] = (pettyCashRequests as any[]).map((p) => ({
      id: p.id,
      sourceType: "PETTY_CASH",
      storeId: p.storeId,
      storeName: p.storeName || "Unknown Store",
      ownerName: p.vendorName || "Vendor",
      amount: Number(p.amount),
      date: p.paymentDate,
      transactionId: p.transactionId || "N/A",
      category: p.category,
      description: p.description
    }));

    // Combine and sort by date DESC
    return [...rentItems, ...utilityItems, ...pettyCashItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
}
