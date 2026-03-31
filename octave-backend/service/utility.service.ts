import { IUtilityRepository, IUtilityService } from "../interfaces/utility.interface";
import { NotificationRepository } from "../repository/notification.repository";

export class UtilityService implements IUtilityService {
  constructor(
    private utilityRepo: IUtilityRepository,
    private notificationRepo: NotificationRepository
  ) {}

  async getAllUtilities(): Promise<any[]> {
    return this.utilityRepo.findAll();
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
  }

  async rejectUtilities(ids: string[]): Promise<void> {
    await this.utilityRepo.rejectUtilities(ids);
  }
}
