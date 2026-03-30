import { IUtilityRepository, IUtilityService } from "../interfaces/utility.interface";

export class UtilityService implements IUtilityService {
  constructor(private utilityRepo: IUtilityRepository) {}

  async getAllUtilities(): Promise<any[]> {
    return this.utilityRepo.findAll();
  }

  async approveUtilities(ids: string[]): Promise<void> {
    await this.utilityRepo.bulkApprove(ids);
  }

  async rejectUtilities(ids: string[]): Promise<void> {
    await this.utilityRepo.rejectUtilities(ids);
  }
}
