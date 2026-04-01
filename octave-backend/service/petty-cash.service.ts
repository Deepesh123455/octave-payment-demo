import { IPettyCashRepository, IPettyCashService } from "../interfaces/petty-cash.interface";
import { ApiError } from "../utils/AppError";
import { NotificationRepository } from "../repository/notification.repository";

export class PettyCashService implements IPettyCashService {
  constructor(
    private pettyCashRepo: IPettyCashRepository,
    private notificationRepo: NotificationRepository
  ) {}

  async getAllRequests(filters?: { storeId?: string; status?: string }): Promise<any[]> {
    return this.pettyCashRepo.findAll(filters);
  }

  async createRequest(data: any): Promise<any> {
    const { amount, storeId, requestedBy, category, description } = data;
    
    if (!amount || amount <= 0) {
      throw new ApiError("Valid amount is required", 400);
    }

    // Determine status based on business logic:
    // ≤ ₹3,000: Auto_Approved
    // ₹3,001 - ₹5,000: Pending_CFO
    // > ₹5,000: Escalated
    let status = "Pending_CFO";
    if (amount <= 3000) {
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
      adminEmail: "all",
      title: "New Petty Cash Request",
      message: `A new request for ${category} (₹${amount}) was created by ${requestedBy}. Status: ${status}`,
      type: status === "Auto_Approved" ? "APPROVAL" : "PETTY_CASH",
      pettyCashId: requestId
    });

    return result;
  }

  async approveRequests(ids: string[], approvedBy: string): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new ApiError("No request IDs provided", 400);
    }
    const items = await this.pettyCashRepo.findByIds(ids);
    await this.pettyCashRepo.bulkApprove(ids, approvedBy);

    // Create notifications for Approval Center in batch
    const notifications = items.map(item => ({
      storeId: item.storeId,
      adminEmail: "all",
      title: "Petty Cash Approved",
      message: `Petty Cash request (ID: ${item.requestId}) has been approved and moved to Approval Center.`,
      type: "APPROVAL",
      pettyCashId: item.requestId
    }));

    await this.notificationRepo.createManyNotifications(notifications);
  }

  async rejectRequests(ids: string[], rejectedBy: string): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new ApiError("No request IDs provided", 400);
    }
    // Update status to Rejected
    await this.pettyCashRepo.updateStatus(ids, "Rejected");
  }
}
