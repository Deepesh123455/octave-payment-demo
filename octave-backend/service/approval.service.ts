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
import { NotificationRepository } from "../repository/notification.repository";
import { CacheService } from "../utils/cache";

export class ApprovalService implements IApprovalService {
  private razorpay: Razorpay;

  constructor(
    private approvalRepo: IApprovalRepository,
    private notificationRepo: NotificationRepository
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.Test_Key_ID!,
      key_secret: process.env.Test_Key_Secret!,
    });
  }

  async getApprovedItems(page: number = 1, limit: number = 20, storeId?: string, sourceType?: string): Promise<{ data: ApprovalItem[]; meta: any }> {
    return CacheService.getOrSet("APPROVAL", { page, limit, storeId, sourceType }, () =>
      this.approvalRepo.getPaginatedApprovedItems(page, limit, storeId, sourceType)
    );
  }

  async initiatePayment(
    items: Array<{ id: string; sourceType: ApprovalSourceType }>
  ): Promise<any> {
    if (items.length === 0) {
      throw new ApiError("No items provided for payment", 400);
    }

    const rentIds = items.filter((i) => i.sourceType === "RENT").map((i) => i.id);
    const utilityIds = items.filter((i) => i.sourceType === "UTILITY").map((i) => i.id);
    const pettyCashIds = items.filter((i) => i.sourceType === "PETTY_CASH").map((i) => i.id);

    const [rents, utilities, pettyCash] = await Promise.all([
      rentIds.length > 0 ? this.approvalRepo.getRentPaymentsByIds(rentIds) : [],
      utilityIds.length > 0 ? this.approvalRepo.getUtilityBillsByIds(utilityIds) : [],
      pettyCashIds.length > 0 ? this.approvalRepo.getPettyCashByIds(pettyCashIds) : [],
    ]);

    const foundCount = rents.length + utilities.length + pettyCash.length;
    if (foundCount === 0) {
      throw new ApiError("No approved items found for provided IDs", 400);
    }

    let totalAmount = 0;
    rents.forEach(r => totalAmount += (Number(r.netPayable) || Number(r.amount)));
    utilities.forEach(u => totalAmount += Number(u.billAmount));
    pettyCash.forEach(p => totalAmount += Number(p.amount));

    let amountInPaise = Math.round(totalAmount * 100);
    
    // DEMO MODE: If using Razorpay Test Key, cap the amount at ₹1.00 (100 paise) 
    // to avoid "Amount exceeds maximum amount allowed" error for high-value rent payments.
    if (process.env.Test_Key_ID?.startsWith('rzp_test_') && amountInPaise > 100000000) {
      console.log(`[Demo Mode] Capping payment amount of ₹${totalAmount} to ₹1.00 for Razorpay Test Order.`);
      amountInPaise = 100; // ₹1.00
    }

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

    // Fetch item details to get storeIds
    const [rents, utilities, pettyCashItems] = await Promise.all([
      rentIds.length > 0 ? this.approvalRepo.getRentPaymentsByIds(rentIds) : Promise.resolve([]),
      utilityIds.length > 0 ? this.approvalRepo.getUtilityBillsByIds(utilityIds) : Promise.resolve([]),
      pettyCashIds.length > 0 ? this.approvalRepo.getPettyCashByIds(pettyCashIds) : Promise.resolve([]),
    ]);

    // Create notifications for transactions
    const notifications: any[] = [];

    rents.forEach(rent => {
      notifications.push({
        storeId: rent.storeId,
        adminEmail: "all",
        title: "Payment Successful",
        message: `Rent payment (ID: ${rent.paymentId}) processed (UTR: ${razorpay_payment_id}).`,
        type: "TRANSACTION",
      });
    });

    utilities.forEach(util => {
      notifications.push({
        storeId: util.storeId,
        adminEmail: "all",
        title: "Payment Successful",
        message: `Utility payment (ID: ${util.billId}) processed (UTR: ${razorpay_payment_id}).`,
        type: "TRANSACTION",
      });
    });

    pettyCashItems.forEach(pc => {
      notifications.push({
        storeId: pc.storeId,
        adminEmail: "all",
        title: "Payment Successful",
        message: `Petty Cash payment (ID: ${pc.requestId}) processed (UTR: ${razorpay_payment_id}).`,
        type: "TRANSACTION",
      });
    });

    if (notifications.length > 0) {
      await this.notificationRepo.createManyNotifications(notifications);
    }

    // Invalidate caches
    await CacheService.invalidateMultiple(["APPROVAL", "RENT", "UTILITY", "PETTY_CASH", "NOTIFICATION", "TRANSACTION"]);
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

    // Fetch item details to get storeIds
    const [rents, utilities, pettyCashItems] = await Promise.all([
      rentIds.length > 0 ? this.approvalRepo.getRentPaymentsByIds(rentIds) : Promise.resolve([]),
      utilityIds.length > 0 ? this.approvalRepo.getUtilityBillsByIds(utilityIds) : Promise.resolve([]),
      pettyCashIds.length > 0 ? this.approvalRepo.getPettyCashByIds(pettyCashIds) : Promise.resolve([]),
    ]);

    // Create notifications for rejected items
    const notifications: any[] = [];

    rents.forEach(rent => {
      notifications.push({
        storeId: rent.storeId,
        adminEmail: "all",
        title: "Item Rejected",
        message: `Rent item (${rent.paymentId}) has been rejected and returned to the pending queue.`,
        type: "RENT_DUE",
        rentPaymentId: rent.paymentId
      });
    });

    utilities.forEach(util => {
      notifications.push({
        storeId: util.storeId,
        adminEmail: "all",
        title: "Item Rejected",
        message: `Utility item (${util.billId}) has been rejected and returned to the pending queue.`,
        type: "UTILITY_DUE",
        utilityBillId: util.billId
      });
    });

    pettyCashItems.forEach(pc => {
      notifications.push({
        storeId: pc.storeId,
        adminEmail: "all",
        title: "Item Rejected",
        message: `Petty Cash item (ID: ${pc.requestId}) has been rejected and returned to the pending queue.`,
        type: "PETTY_CASH",
        pettyCashId: pc.requestId
      });
    });

    if (notifications.length > 0) {
      await this.notificationRepo.createManyNotifications(notifications);
    }

    // Invalidate caches
    await CacheService.invalidateMultiple(["APPROVAL", "RENT", "UTILITY", "PETTY_CASH", "NOTIFICATION"]);
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
