import { PrismaClient, RentPayment } from "@prisma/client";
import { IRentRepository } from "../interfaces/rent.interface";
import { prisma } from "../config/db";

export class RentRepository implements IRentRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(page: number = 1, limit: number = 20, status?: string): Promise<{ data: any[], meta: any }> {
    const skip = (page - 1) * limit;
    const where: any = status && status !== "All" ? { status } : {};

    const [data, total] = await Promise.all([
      this.prisma.rentPayment.findMany({
        where,
        select: {
          id: true,
          paymentId: true,
          storeId: true,
          landlordId: true,
          paymentMonth: true,
          amount: true,
          latePenalty: true,
          totalPaid: true,
          dueDate: true,
          paymentDate: true,
          paymentMode: true,
          utrReference: true,
          status: true,
          tdsDeducted: true,
          gst: true,
          netPayable: true,
          invoiceNumber: true,
          remarks: true,
          store: { select: { storeName: true } },
          landlord: { select: { companyName: true } }
        },
        orderBy: { dueDate: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.rentPayment.count({ where })
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

  async findByIds(ids: string[]): Promise<RentPayment[]> {
    return this.prisma.rentPayment.findMany({
      where: {
        id: { in: ids }
      }
    });
  }

  async updateStatus(ids: string[], status: string, utrReference?: string): Promise<void> {
    if (utrReference) {
      await this.prisma.$executeRaw`
        UPDATE rent_payments
        SET status = ${status}::"PaymentStatus",
            "paymentDate" = NOW(),
            "utrReference" = ${utrReference}
        WHERE (id::text = ANY(${ids}) OR "paymentId" = ANY(${ids}))
      `;
    } else {
      await this.prisma.$executeRaw`
        UPDATE rent_payments
        SET status = ${status}::"PaymentStatus"
        WHERE (id::text = ANY(${ids}) OR "paymentId" = ANY(${ids}))
      `;
    }
  }

  async bulkApprove(ids: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE rent_payments
      SET status = 'Approved'::"PaymentStatus"
      WHERE (id::text = ANY(${ids}) OR "paymentId" = ANY(${ids}))
      AND status IN ('Pending', 'Overdue', 'Pending_Approval', 'Rejected')
    `;
  }

  async rejectPayments(ids: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE rent_payments
      SET status = 'Rejected'::"PaymentStatus"
      WHERE (id::text = ANY(${ids}) OR "paymentId" = ANY(${ids}))
      AND status IN ('Pending', 'Overdue', 'Pending_Approval')
    `;
  }
}
