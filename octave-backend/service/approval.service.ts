import Razorpay from "razorpay";
import crypto from "crypto";
import {
  IApprovalRepository,
  IApprovalService,
  ApprovalItem,
  ApprovalSourceType,
  VerifyApprovalPaymentPayload,
} from "../interfaces/approval.interface";
import { ApiError } from "../utils/AppError";

export class ApprovalService implements IApprovalService {
  private razorpay: Razorpay;

  constructor(private approvalRepo: IApprovalRepository) {
    this.razorpay = new Razorpay({
      key_id: process.env.Test_Key_ID!,
      key_secret: process.env.Test_Key_Secret!,
    });
  }

  async getApprovedItems(): Promise<ApprovalItem[]> {
    const [rentPayments, utilityBills, pettyCashRequests] = await Promise.all([
      this.approvalRepo.getApprovedRentPayments(),
      this.approvalRepo.getApprovedUtilityBills(),
      this.approvalRepo.getApprovedPettyCash(),
    ]);

    const rentItems: ApprovalItem[] = rentPayments.map((r: any) => ({
      id: r.id,
      sourceType: "RENT" as ApprovalSourceType,
      storeName: r.storeName || "Unknown Store",
      storeId: r.storeId,
      category: "Rent",
      description: `${r.paymentMonth} rent payment`,
      amount: Number(r.netPayable) || Number(r.amount),
      dueDate: r.dueDate,
      status: r.status,
    }));

    const utilityItems: ApprovalItem[] = utilityBills.map((u: any) => ({
      id: u.id,
      sourceType: "UTILITY" as ApprovalSourceType,
      storeName: u.storeName || "Unknown Store",
      storeId: u.storeId,
      category: this.formatUtilityType(u.utilityType),
      description: `${u.billMonth} ${this.formatUtilityType(u.utilityType).toLowerCase()} bill - ${u.providerName}`,
      amount: Number(u.billAmount),
      dueDate: u.dueDate,
      status: u.status,
    }));

    const pettyCashItems: ApprovalItem[] = pettyCashRequests.map((p: any) => ({
      id: p.id,
      sourceType: "PETTY_CASH" as ApprovalSourceType,
      storeName: p.storeName || "Unknown Store",
      storeId: p.storeId,
      category: p.category,
      description: `${p.description} - Requested by ${p.requestedBy}`,
      amount: Number(p.amount),
      dueDate: p.requestDate,
      status: p.status,
    }));

    return [...rentItems, ...utilityItems, ...pettyCashItems].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }

  async initiatePayment(
    items: Array<{ id: string; sourceType: ApprovalSourceType }>
  ): Promise<any> {
    if (items.length === 0) {
      throw new ApiError("No items provided for payment", 400);
    }

    // Fetch all approved items to get amounts
    const allApproved = await this.getApprovedItems();
    const selectedItems = allApproved.filter((a) =>
      items.some((i) => i.id === a.id && i.sourceType === a.sourceType)
    );

    if (selectedItems.length === 0) {
      throw new ApiError("No approved items found for provided IDs", 400);
    }

    const totalAmount = selectedItems.reduce((sum, item) => sum + item.amount, 0);
    const amountInPaise = Math.round(totalAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_approval_${Date.now()}`,
    };

    try {
      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error("Razorpay Order Creation Error:", error);
      throw new ApiError("Failed to create Razorpay order", 500);
    }
  }

  async confirmPayment(payload: VerifyApprovalPaymentPayload): Promise<void> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items } = payload;

    // Verify Razorpay signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac("sha256", process.env.Test_Key_Secret!)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      throw new ApiError("Invalid payment signature. Verification failed.", 400);
    }

    // Split items by source type and mark as paid
    const rentIds = items.filter((i) => i.sourceType === "RENT").map((i) => i.id);
    const utilityIds = items.filter((i) => i.sourceType === "UTILITY").map((i) => i.id);
    const pettyCashIds = items.filter((i) => i.sourceType === "PETTY_CASH").map((i) => i.id);

    await Promise.all([
      rentIds.length > 0
        ? this.approvalRepo.markRentAsPaid(rentIds, razorpay_payment_id)
        : Promise.resolve(),
      utilityIds.length > 0
        ? this.approvalRepo.markUtilityAsPaid(utilityIds, razorpay_payment_id)
        : Promise.resolve(),
      pettyCashIds.length > 0
        ? this.approvalRepo.markPettyCashAsPaid(pettyCashIds, razorpay_payment_id)
        : Promise.resolve(),
    ]);
  }

  async rejectItems(
    items: Array<{ id: string; sourceType: ApprovalSourceType }>
  ): Promise<void> {
    const rentIds = items.filter((i) => i.sourceType === "RENT").map((i) => i.id);
    const utilityIds = items.filter((i) => i.sourceType === "UTILITY").map((i) => i.id);
    const pettyCashIds = items.filter((i) => i.sourceType === "PETTY_CASH").map((i) => i.id);

    await Promise.all([
      rentIds.length > 0
        ? this.approvalRepo.rejectRentPayments(rentIds)
        : Promise.resolve(),
      utilityIds.length > 0
        ? this.approvalRepo.rejectUtilityBills(utilityIds)
        : Promise.resolve(),
      pettyCashIds.length > 0
        ? this.approvalRepo.rejectPettyCash(pettyCashIds)
        : Promise.resolve(),
    ]);
  }

  private formatUtilityType(type: string): string {
    const labels: Record<string, string> = {
      Electricity: "Electricity",
      Internet: "Internet",
      Water: "Water",
      CAM: "CAM Charges",
      DG: "DG Charges",
    };
    return labels[type] || type;
  }
}
