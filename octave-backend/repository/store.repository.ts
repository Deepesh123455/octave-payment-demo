import { PrismaClient, Store } from "@prisma/client";
import { IStoreRepository } from "../interfaces/store.interface";
import { prisma } from "../config/db";

export class StoreRepository implements IStoreRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(): Promise<Store[]> {
    return this.prisma.store.findMany({
      orderBy: { storeId: "asc" },
    });
  }

  async findById(id: string): Promise<Store | null> {
    return this.prisma.store.findUnique({
      where: { storeId: id },
      include: {
        landlord: true,
        rentPayments: {
          orderBy: { dueDate: "desc" },
          take: 10,
        },
        utilityBills: {
          orderBy: { dueDate: "desc" },
          take: 10,
        },
        pettyCashRequests: {
          orderBy: { requestDate: "desc" },
          take: 10,
        },
      },
    });
  }
}