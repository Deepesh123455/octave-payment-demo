import Razorpay from "razorpay";
import crypto from "crypto";
import { IRentRepository, IRentService, VerifyPaymentPayload } from "../interfaces/rent.interface";
import { ApiError } from "../utils/AppError";
import { NotificationRepository } from "../repository/notification.repository";
import { CacheService } from "../utils/cache";

export class RentService implements IRentService {
  private razorpay: Razorpay;

  constructor(
    private rentRepo: IRentRepository,
    private notificationRepo: NotificationRepository
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.Test_Key_ID!,
      key_secret: process.env.Test_Key_Secret!,
    });
  }

  async getAllRentPayments(page: number = 1, limit: number = 50, status?: string): Promise<{ data: any[]; meta: any }> {
    return CacheService.getOrSet("RENT", { page, limit, status }, () =>
      this.rentRepo.findAll(page, limit, status)
    );
  }

  async createRazorpayOrder(paymentIds: string[]): Promise<any> {
    const payments = await this.rentRepo.findByIds(paymentIds);
    if (payments.length === 0) {
      throw new ApiError("No valid rent payments found for the provided IDs", 400);
    }

    // Validation: Only "Approved" status can be paid
    const unapproved = payments.filter(p => p.status !== ("Approved" as any));
    if (unapproved.length > 0) {
      throw new ApiError(`Some selected payments are not approved: ${unapproved.map(p => p.paymentId).join(", ")}`, 400);
    }

    // Calculate total net payable in Paise (Razorpay expects smallest currency unit)
    const totalAmount = payments.reduce((sum, p) => sum + p.netPayable, 0);
    let amountInPaise = totalAmount * 100;

    // DEMO MODE: If using Razorpay Test Key, cap the amount at ₹1.00 (100 paise) 
    // to avoid "Amount exceeds maximum amount allowed" error for high-value rent payments.
    if (process.env.Test_Key_ID?.startsWith('rzp_test_') && amountInPaise > 1000000) {
      console.log(`[Demo Mode] Capping rent payment of ₹${totalAmount} to ₹1.00 for Razorpay Test Order.`);
      amountInPaise = 100; // ₹1.00
    }

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_bulk_${Date.now()}`,
    };

    try {
      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error("Razorpay Order Creation Error:", error);
      throw new ApiError("Failed to create Razorpay order", 500);
    }
  }

  async verifyPayment(payload: VerifyPaymentPayload): Promise<void> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentIds } = payload;

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac("sha256", process.env.Test_Key_Secret!)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      throw new ApiError("Invalid payment signature. Verification failed.", 400);
    }

    // Update status to Paid for all selected payments
    await this.rentRepo.updateStatus(paymentIds, "Paid", razorpay_payment_id);
    
    // Invalidate caches
    await CacheService.invalidateMultiple(["RENT", "APPROVAL", "NOTIFICATION", "TRANSACTION"]);
  }

  async approvePayments(ids: string[]): Promise<void> {
    const items = await this.rentRepo.findByIds(ids);
    await this.rentRepo.bulkApprove(ids);
    
    // Create notifications for Approval Center
    const notifications = items.map(item => ({
      storeId: item.storeId,
      adminEmail: "all",
      title: "Rent Approved",
      message: `Rent payment (ID: ${item.paymentId}) has been approved and is waiting for payment in the Approval Center.`,
      type: "APPROVAL",
      rentPaymentId: item.paymentId
    }));

    await this.notificationRepo.createManyNotifications(notifications);

    // Invalidate caches
    await CacheService.invalidateMultiple(["RENT", "APPROVAL", "NOTIFICATION"]);
  }

  async rejectPayments(ids: string[]): Promise<void> {
    await this.rentRepo.rejectPayments(ids);
    await CacheService.invalidateMultiple(["RENT", "APPROVAL", "NOTIFICATION"]);
  }
}
