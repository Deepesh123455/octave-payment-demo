import { IPettyCashRepository, IPettyCashService } from "../interfaces/petty-cash.interface";
import { ApiError } from "../utils/AppError";
import { NotificationRepository } from "../repository/notification.repository";
import { CacheService } from "../utils/cache";

export class PettyCashService implements IPettyCashService {
  constructor(
    private pettyCashRepo: IPettyCashRepository,
    private notificationRepo: NotificationRepository
  ) {}

  async getAllRequests(filters?: { storeId?: string; status?: string; page?: number; limit?: number }): Promise<{ data: any[]; meta: any }> {
    return CacheService.getOrSet("PETTY_CASH", { cacheSchema: "manager-name-v2", ...(filters || {}) }, () =>
      this.pettyCashRepo.findAll(filters)
    );
  }

  async createRequest(data: any): Promise<any> {
    const { amount, storeId, requestedBy, category, description } = data;
    
    if (!amount || amount <= 0) {
      throw new ApiError("Valid amount is required", 400);
    }

    // Determine status based on business logic:
    // < ₹2,000: Auto_Approved
    // ₹2,000 - ₹5,000: Pending_CFO
    // > ₹5,000: Escalated
    let status = "Pending_CFO";
    if (amount < 2000) {
      status = "Auto_Approved";
    } else if (amount > 5000) {
      status = "Escalated";
    }

    // Generate Request ID: PC-TIMESTAMP
    const requestId = `PC-${Date.now()}`;

    const result = await this.pettyCashRepo.create({
      requestId,
      storeId,
      requestedBy,
      amount,
      category,
      description,
      status
    });

    // Create notification
    await this.notificationRepo.createNotification({
      storeId: storeId,
      adminEmail: "admins",
      title: "New Petty Cash Request",
      message: `A new request for ${category} (₹${amount}) was created by ${requestedBy}. Status: ${status}`,
      type: "PETTY_CASH",
      pettyCashId: requestId
    });

    await CacheService.invalidateMultiple(["PETTY_CASH", "NOTIFICATION"]);
    return result;
  }

  async approveRequests(ids: string[], approvedBy: string): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new ApiError("No request IDs provided", 400);
    }
    const items = await this.pettyCashRepo.findByIds(ids);
    await this.pettyCashRepo.bulkApprove(ids, approvedBy);

    // Notify the petty cash module so store managers can settle approved requests there.
    const notifications = items.flatMap(item => ([
      {
        storeId: item.storeId,
        adminEmail: "store",
        title: "Petty Cash Approved",
        message: `Petty Cash request (ID: ${item.requestId}) has been approved. It is now available in your transaction history.`,
        type: "PETTY_CASH",
        pettyCashId: item.requestId
      },
      {
        storeId: item.storeId,
        adminEmail: "all",
        title: "Transaction Updated",
        message: `Approved petty cash request (ID: ${item.requestId}) has been added to transaction history.`,
        type: "TRANSACTION",
        pettyCashId: item.requestId
      }
    ]));

    await this.notificationRepo.createManyNotifications(notifications);
    await CacheService.invalidateMultiple(["PETTY_CASH", "APPROVAL", "NOTIFICATION", "TRANSACTION"]);
  }

  async rejectRequests(ids: string[], rejectedBy: string): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new ApiError("No request IDs provided", 400);
    }
    const items = await this.pettyCashRepo.findByIds(ids);
    // Update status to Rejected
    await this.pettyCashRepo.updateStatus(ids, "Rejected");
    const notifications = items.map(item => ({
      storeId: item.storeId,
      adminEmail: "store",
      title: "Petty Cash Rejected",
      message: `Petty Cash request (ID: ${item.requestId}) has been rejected. Please review and resubmit if needed.`,
      type: "PETTY_CASH",
      pettyCashId: item.requestId
    }));
    await this.notificationRepo.createManyNotifications(notifications);
    await CacheService.invalidateMultiple(["PETTY_CASH", "APPROVAL", "NOTIFICATION"]);
  }

  async processDirectPayment(data: { storeId: string; amount: number; category: string; description: string; requestedBy: string; razorpayPaymentId: string }): Promise<any> {
    const result = await this.pettyCashRepo.processDirectPayment(data);
    await CacheService.invalidateMultiple(["PETTY_CASH", "STORE", "TRANSACTION", "NOTIFICATION"]);
    return result;
  }
}
