// src/repositories/AdminRepository.ts
import { PrismaClient } from "@prisma/client";
import { IAdminRepository, IAdminRecord } from "../interfaces/auth.interface";

export class AdminRepository implements IAdminRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async findAdminByEmail(hash: string): Promise<IAdminRecord | null> {
    // Only the repository interacts directly with the database
    return await this.prisma.admin.findUnique({
      where: { emailHash: hash },
    });
  }
}