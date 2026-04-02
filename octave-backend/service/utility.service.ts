import { IUtilityRepository, IUtilityService } from "../interfaces/utility.interface";
import { NotificationRepository } from "../repository/notification.repository";
import { CacheService } from "../utils/cache";

export class UtilityService implements IUtilityService {
  constructor(
    private utilityRepo: IUtilityRepository,
    private notificationRepo: NotificationRepository
  ) {}

  async getAllUtilities(page: number = 1, limit: number = 50, status?: string): Promise<{ data: any[], meta: any }> {
    return CacheService.getOrSet("UTILITY", { page, limit, status }, () =>
      this.utilityRepo.findAll(page, limit, status)
    );
  }

  async approveUtilities(ids: string[]): Promise<void> {
    const items = await this.utilityRepo.findByIds(ids);
    await this.utilityRepo.bulkApprove(ids);
    for (const item of items) {
      await this.notificationRepo.createNotification({
        storeId: item.storeId,
        adminEmail: "all",
        title: "Utility Bill Approved",
        message: `Utility bill (ID: ${item.billId}) has been approved and moved to Approval Center.`,
        type: "APPROVAL",
        utilityBillId: item.billId
      });
    }

    // Invalidate caches
    await CacheService.invalidateMultiple(["UTILITY", "APPROVAL", "NOTIFICATION"]);
  }

  async rejectUtilities(ids: string[]): Promise<void> {
    await this.utilityRepo.rejectUtilities(ids);
    await CacheService.invalidateMultiple(["UTILITY", "APPROVAL", "NOTIFICATION"]);
  }
}
