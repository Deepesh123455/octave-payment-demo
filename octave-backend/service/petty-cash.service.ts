import { IPettyCashRepository, IPettyCashService } from "../interfaces/petty-cash.interface";
import { ApiError } from "../utils/AppError";

export class PettyCashService implements IPettyCashService {
  constructor(private pettyCashRepo: IPettyCashRepository) {}

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

    return this.pettyCashRepo.create({
      requestId,
      storeId,
      requestedBy,
      amount,
      category,
      description,
      status
    });
  }

  async approveRequests(ids: string[], approvedBy: string): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new ApiError("No request IDs provided", 400);
    }
    await this.pettyCashRepo.bulkApprove(ids, approvedBy);
  }

  async rejectRequests(ids: string[], rejectedBy: string): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new ApiError("No request IDs provided", 400);
    }
    // Update status to Rejected
    await this.pettyCashRepo.updateStatus(ids, "Rejected");
  }
}
