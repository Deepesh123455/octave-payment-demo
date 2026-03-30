import { UtilityBill } from "@prisma/client";

export interface IUtilityRepository {
  findAll(): Promise<any[]>;
  findByIds(ids: string[]): Promise<any[]>;
  bulkApprove(ids: string[]): Promise<void>;
  rejectUtilities(ids: string[]): Promise<void>;
}

export interface IUtilityService {
  getAllUtilities(): Promise<any[]>;
  approveUtilities(ids: string[]): Promise<void>;
  rejectUtilities(ids: string[]): Promise<void>;
}
