import { RentPayment } from "@prisma/client";

export interface IRentRepository {
  findAll(page?: number, limit?: number, status?: string): Promise<{ data: any[]; meta: any }>;
  findByIds(ids: string[]): Promise<RentPayment[]>;
  updateStatus(ids: string[], status: any, utrReference?: string): Promise<void>;
  bulkApprove(ids: string[]): Promise<void>;
  rejectPayments(ids: string[]): Promise<void>;
}

export interface IRentService {
  getAllRentPayments(page?: number, limit?: number, status?: string): Promise<{ data: any[]; meta: any }>;
  createRazorpayOrder(paymentIds: string[]): Promise<any>;
  verifyPayment(payload: any): Promise<void>;
  approvePayments(ids: string[]): Promise<void>;
  rejectPayments(ids: string[]): Promise<void>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface VerifyPaymentPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  paymentIds: string[];
}
