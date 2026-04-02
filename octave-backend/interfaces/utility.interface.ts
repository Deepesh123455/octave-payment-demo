import { UtilityBill } from "@prisma/client";

export interface IUtilityRepository {
  findAll(page?: number, limit?: number, status?: string): Promise<{ data: any[]; meta: any }>;
  findByIds(ids: string[]): Promise<any[]>;
  bulkApprove(ids: string[]): Promise<void>;
  rejectUtilities(ids: string[]): Promise<void>;
}

export interface IUtilityService {
  getAllUtilities(page?: number, limit?: number, status?: string): Promise<{ data: any[]; meta: any }>;
  approveUtilities(ids: string[]): Promise<void>;
  rejectUtilities(ids: string[]): Promise<void>;
}
