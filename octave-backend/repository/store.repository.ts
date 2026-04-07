import { PrismaClient, Store } from "@prisma/client";
import { IStoreRepository } from "../interfaces/store.interface";
import { prisma } from "../config/db";

export class StoreRepository implements IStoreRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  private normalizeStore(store: any) {
    if (
      store?.storeId === "STO001" &&
      store?.managerEmail === "democfo@gmail.com" &&
      store?.managerName === "Demo Manager"
    ) {
      return {
        ...store,
        managerName: "Rajesh Malhotra",
      };
    }

    return store;
  }

  async findAll(): Promise<any[]> {
    const stores = await this.prisma.store.findMany({
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
        managerEmail: true,
        managerPhone: true,
        zoneManager: true,
        landlordId: true,
        monthlyRent: true,
        rentDueDay: true,
        securityDeposit: true,
        leaseStartDate: true,
        leaseEndDate: true,
        pettyCashLimit: true,
        pettyCashBalance: true,
        virtualCardNumber: true,
        openingDate: true,
        storeStatus: true,
        squareFeet: true,
        bankAccountLast4: true,
        tallyCostCenter: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        storeId: "asc",
      },
    });

    return stores.map((store) => this.normalizeStore(store));
  }

  async findById(id: string): Promise<Store | null> {
    const store = await this.prisma.store.findUnique({
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

    return store ? this.normalizeStore(store) : null;
  }

  async updatePettyCashBalance(id: string, amount: number): Promise<any> {
    return this.prisma.store.update({
      where: { storeId: id },
      data: {
        pettyCashBalance: amount,
      },
    });
  }
}
