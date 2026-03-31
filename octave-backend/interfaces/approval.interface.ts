export type ApprovalSourceType = "RENT" | "UTILITY" | "PETTY_CASH";

export interface ApprovalItem {
  id: string;
  sourceType: ApprovalSourceType;
  storeName: string;
  storeId: string;
  category: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: string;
}

export interface VerifyApprovalPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  items: Array<{ id: string; sourceType: ApprovalSourceType }>;
}

export interface IApprovalRepository {
  getApprovedRentPayments(): Promise<any[]>;
  getApprovedUtilityBills(): Promise<any[]>;
  getApprovedPettyCash(): Promise<any[]>;
  rejectRentPayments(ids: string[]): Promise<void>;
  rejectUtilityBills(ids: string[]): Promise<void>;
  rejectPettyCash(ids: string[]): Promise<void>;
  markRentAsPaid(ids: string[], utr: string): Promise<void>;
  markUtilityAsPaid(ids: string[], utr: string): Promise<void>;
  markPettyCashAsPaid(ids: string[], utr: string): Promise<void>;
  getRentPaymentsByIds(ids: string[]): Promise<any[]>;
  getUtilityBillsByIds(ids: string[]): Promise<any[]>;
  getPettyCashByIds(ids: string[]): Promise<any[]>;
}

export interface IApprovalService {
  getApprovedItems(): Promise<ApprovalItem[]>;
  initiatePayment(items: Array<{ id: string; sourceType: ApprovalSourceType }>): Promise<any>;
  confirmPayment(payload: VerifyApprovalPaymentPayload): Promise<void>;
  rejectItems(items: Array<{ id: string; sourceType: ApprovalSourceType }>): Promise<void>;
}
