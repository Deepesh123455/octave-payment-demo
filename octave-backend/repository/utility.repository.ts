import { PrismaClient } from "@prisma/client";
import { IUtilityRepository } from "../interfaces/utility.interface";

export class UtilityRepository implements IUtilityRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<any[]> {
    return this.prisma.utilityBill.findMany({
      include: {
        store: true,
      },
      orderBy: {
        dueDate: "desc",
      },
    });
  }

  async findByIds(ids: string[]): Promise<any[]> {
    return this.prisma.utilityBill.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        store: true,
      },
    });
  }

  async bulkApprove(ids: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE utility_bills
      SET status = 'Approved'::"PaymentStatus"
      WHERE id::text = ANY(${ids})
      AND status IN ('Pending', 'Overdue', 'Pending_Approval', 'Rejected')
    `;
  }

  async rejectUtilities(ids: string[]): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE utility_bills
      SET status = 'Rejected'::"PaymentStatus"
      WHERE id::text = ANY(${ids})
      AND status IN ('Pending', 'Overdue', 'Pending_Approval')
    `;
  }
}
