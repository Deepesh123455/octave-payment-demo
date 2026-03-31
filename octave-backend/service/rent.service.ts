import Razorpay from "razorpay";
import crypto from "crypto";
import { IRentRepository, IRentService, VerifyPaymentPayload } from "../interfaces/rent.interface";
import { ApiError } from "../utils/AppError";
import { NotificationRepository } from "../repository/notification.repository";

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

  async getAllRentPayments(): Promise<any[]> {
    return this.rentRepo.findAll();
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
    const amountInPaise = totalAmount * 100;

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
  }

  async approvePayments(ids: string[]): Promise<void> {
    const items = await this.rentRepo.findByIds(ids);
    await this.rentRepo.bulkApprove(ids);
    
    // Create notifications for Approval Center
    for (const item of items) {
      await this.notificationRepo.createNotification({
        storeId: item.storeId,
        adminEmail: "all",
        title: "Rent Approved",
        message: `Rent payment (ID: ${item.paymentId}) has been approved and is waiting for payment in the Approval Center.`,
        type: "APPROVAL",
        rentPaymentId: item.paymentId
      });
    }
  }

  async rejectPayments(ids: string[]): Promise<void> {
    await this.rentRepo.rejectPayments(ids);
    // Optionally create a notification for rejection, but usually items just stay in the same list or move to a 'Rejected' status.
  }
}
