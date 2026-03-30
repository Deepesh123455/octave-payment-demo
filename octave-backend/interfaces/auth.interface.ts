import { AppRole } from "../utils/crypto";

export interface IAdminRecord {
  id: string;
  emailHash: string;
  emailEncrypted: string;
  roleEncrypted: string;
  createdAt: Date;
}

export interface IAdminRepository {
  findAdminByEmail(emailHash: string): Promise<IAdminRecord | null>;
}

export interface IAuthService {
  processOtpRequest(email: string, requestedRole: AppRole): Promise<void>;
  
  // 👇 ADDED: The new verify contract
  verifyOtpAndLogin(
    email: string, 
    requestedRole: AppRole, 
    providedOtp: string
  ): Promise<{ admin: Partial<IAdminRecord> & { email: string, role: AppRole }; token: string }>;
}