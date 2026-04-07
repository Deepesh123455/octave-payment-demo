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
  findAll(filters?: { storeId?: string; status?: string; page?: number; limit?: number }): Promise<{ data: any[]; meta: any }>;
  create(data: any): Promise<any>;
  bulkApprove(ids: string[], approvedBy: string): Promise<void>;
  findByIds(ids: string[]): Promise<any[]>;
  updateStatus(ids: string[], status: string): Promise<void>;
  processDirectPayment(data: { storeId: string; amount: number; category: string; description: string; requestedBy: string; razorpayPaymentId: string }): Promise<any>;
}

export interface IPettyCashService {
  getAllRequests(filters?: { storeId?: string; status?: string; page?: number; limit?: number }): Promise<{ data: any[]; meta: any }>;
  createRequest(data: any): Promise<any>;
  approveRequests(ids: string[], approvedBy: string): Promise<void>;
  rejectRequests(ids: string[], rejectedBy: string): Promise<void>;
  processDirectPayment(data: { storeId: string; amount: number; category: string; description: string; requestedBy: string; razorpayPaymentId: string }): Promise<any>;
}
