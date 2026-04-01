import { PrismaClient, Store } from "@prisma/client";
import { IStoreRepository } from "../interfaces/store.interface";
import { prisma } from "../config/db";

export class StoreRepository implements IStoreRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findAll(): Promise<any[]> {
    return this.prisma.store.findMany({
      select: {
        id: true,
        storeId: true,
        storeName: true,
        city: true,
        state: true,
        region: true,
        mallOrMarket: true,
        type: true,
        managerName: true,
        storeStatus: true,
        monthlyRent: true,
      },
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