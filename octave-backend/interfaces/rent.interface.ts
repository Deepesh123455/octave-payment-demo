import { RentPayment } from "@prisma/client";

export interface IRentRepository {
  findAll(): Promise<RentPayment[]>;
  findByIds(ids: string[]): Promise<RentPayment[]>;
  updateStatus(ids: string[], status: any, utrReference?: string): Promise<void>;
  bulkApprove(ids: string[]): Promise<void>;
  rejectPayments(ids: string[]): Promise<void>;
}

export interface IRentService {
  getAllRentPayments(): Promise<RentPayment[]>;
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
