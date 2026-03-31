import { PettyCashStatus, PaymentMode } from "@prisma/client";

export interface PettyCashRequest {
  id: string;
  requestId: string;
  storeId: string;
  requestedBy: string;
  requestDate: Date;
  amount: number;
  category: string;
  description: string;
  vendorName?: string | null;
  billNumber?: string | null;
  status: PettyCashStatus;
  approvedBy?: string | null;
  approvalDate?: Date | null;
  paymentMode?: PaymentMode | null;
  remarks?: string | null;
}

export interface IPettyCashRepository {
  findAll(filters?: { storeId?: string; status?: string }): Promise<any[]>;
  create(data: any): Promise<any>;
  bulkApprove(ids: string[], approvedBy: string): Promise<void>;
  findByIds(ids: string[]): Promise<any[]>;
  updateStatus(ids: string[], status: string): Promise<void>;
}

export interface IPettyCashService {
  getAllRequests(filters?: { storeId?: string; status?: string }): Promise<any[]>;
  createRequest(data: any): Promise<any>;
  approveRequests(ids: string[], approvedBy: string): Promise<void>;
  rejectRequests(ids: string[], rejectedBy: string): Promise<void>;
}
