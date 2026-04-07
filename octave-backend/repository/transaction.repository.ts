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

  async getAllTransactions(page: number = 1, limit: number = 20, storeId?: string, sourceType?: string): Promise<{ data: TransactionItem[]; meta: any }> {
    const skip = (page - 1) * limit;
    
    // Explicitly handle "all" storeId and sanitize parameters
    const filterStoreId = (storeId === "all" || !storeId) ? null : storeId;

    const dataRaw: any[] = await this.prisma.$queryRaw`
      SELECT * FROM (
        SELECT rp.id, rp."storeId", COALESCE(rp."totalPaid", rp.amount) as amount, rp."paymentDate" as date, 'RENT' as "sourceType", rp."utrReference" as "transactionId", 'Rent'::text as category, rp."paymentMonth" || ' rent payment' as description, s."storeName", l."companyName" as "ownerName"
        FROM rent_payments rp
        LEFT JOIN stores s ON rp."storeId" = s."storeId"
        LEFT JOIN landlords l ON rp."landlordId" = l."landlordId"
        WHERE rp.status = 'Paid'
          AND (${filterStoreId}::text IS NULL OR rp."storeId" = ${filterStoreId})
        
        UNION ALL
        
        SELECT ub.id, ub."storeId", ub."billAmount" as amount, ub."paymentDate" as date, 'UTILITY' as "sourceType", ub."transactionId", ub."utilityType"::text as category, ub."billMonth" || ' utility bill' as description, s."storeName", ub."providerName" as "ownerName"
        FROM utility_bills ub
        LEFT JOIN stores s ON ub."storeId" = s."storeId"
        WHERE ub.status = 'Paid'
          AND (${filterStoreId}::text IS NULL OR ub."storeId" = ${filterStoreId})

        UNION ALL

        SELECT pcr.id, pcr."storeId", pcr.amount, COALESCE(pcr."paymentDate", pcr."requestDate") as date, 'PETTY_CASH' as "sourceType", COALESCE(pcr."transactionId", pcr."requestId") as "transactionId", pcr.category::text, pcr.description, s."storeName", COALESCE(pcr."vendorName", 'Vendor') as "ownerName"
        FROM petty_cash_requests pcr
        LEFT JOIN stores s ON pcr."storeId" = s."storeId"
        WHERE (pcr.status = 'Paid' OR pcr.status = 'Auto_Approved' OR pcr.status = 'Approved')
          AND (${filterStoreId}::text IS NULL OR pcr."storeId" = ${filterStoreId})
      ) as combined
      WHERE (${sourceType || null}::text IS NULL OR combined."sourceType" = ${sourceType})
      ORDER BY combined.date DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countRaw: any[] = await this.prisma.$queryRaw`
      SELECT SUM(count) as total FROM (
        SELECT COUNT(*) as count FROM rent_payments 
        WHERE status = 'Paid' AND (${filterStoreId}::text IS NULL OR "storeId" = ${filterStoreId})
          AND (${sourceType || null}::text IS NULL OR 'RENT' = ${sourceType})
        
        UNION ALL
        
        SELECT COUNT(*) as count FROM utility_bills 
        WHERE status = 'Paid' AND (${filterStoreId}::text IS NULL OR "storeId" = ${filterStoreId})
          AND (${sourceType || null}::text IS NULL OR 'UTILITY' = ${sourceType})
        
        UNION ALL
        
        SELECT COUNT(*) as count FROM petty_cash_requests 
        WHERE (status = 'Paid' OR status = 'Auto_Approved' OR status = 'Approved') AND (${filterStoreId}::text IS NULL OR "storeId" = ${filterStoreId})
          AND (${sourceType || null}::text IS NULL OR 'PETTY_CASH' = ${sourceType})
      ) as count_combined
    `;
    const total = Number(countRaw[0]?.total || 0);

    const mappedData: TransactionItem[] = dataRaw.map(row => ({
      id: row.id,
      sourceType: row.sourceType,
      storeId: row.storeId,
      storeName: row.storeName || "Unknown Store",
      ownerName: row.ownerName || (row.sourceType === "UTILITY" ? "Utility Provider" : "Vendor"),
      amount: Number(row.amount),
      date: row.date,
      transactionId: row.transactionId || row.transactionid || row.requestId || row.requestid || "N/A",
      category: row.category,
      description: row.description
    }));

    return {
      data: mappedData,
      meta: {
        totalRecords: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    };
  }
}
