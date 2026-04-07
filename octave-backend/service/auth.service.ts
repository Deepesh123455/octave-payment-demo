// src/services/auth.service.ts
import {
  AppRole,
  blindIndex,
  decryptRole,
  generateCrypto,
  decryptEmail,
} from "../utils/crypto";
import { sendOtpEmail } from "../utils/email.utils";
import redisClient from "../config/redis";
import { ApiError } from "../utils/AppError";
import { generateRedisKey } from "../config/redisKey";
import { generateOtp } from "../utils/otp-generator";
import { IAuthService, IAdminRepository } from "../interfaces/auth.interface";
import jwt from "jsonwebtoken";

export class AuthService implements IAuthService {
  constructor(private adminRepo: IAdminRepository) {}

  // ── 1. SEND OTP (Unchanged) ──
  async processOtpRequest(email: string, requestedRole: AppRole): Promise<void> {
    try {
      const searchHash = blindIndex(email);
      const cooldownKey = generateRedisKey("OTP_COOLDOWN", searchHash);
      const cooldownTTL = await redisClient.ttl(cooldownKey);

      if (cooldownTTL > 0) {
        throw new ApiError(`Please wait ${cooldownTTL} seconds before requesting a new OTP.`, 429);
      }

      await redisClient.setex(cooldownKey, 60, "1");

      const adminRecord = await this.adminRepo.findAdminByEmail(searchHash);
      if (!adminRecord) return;

      const actualRole = decryptRole(adminRecord.roleEncrypted);
      if (actualRole !== requestedRole) return;

      const secureEmailTarget = decryptEmail(adminRecord.emailEncrypted);
      const rawOtp = generateOtp();
      const hashedOtp = generateCrypto(rawOtp);

      const otpKey = generateRedisKey("OTP_HASH", adminRecord.id);
      await redisClient.setex(otpKey, 300, hashedOtp);

      // ─── OTP Bypass for Demo Account (Backend Verified) ───
      const demoEmail = process.env.DEMO_EMAIL || "democfo@gmail.com";
      if (email === demoEmail) {
        console.log(`[Demo] OTP bypass for ${email}. Check environment config for code.`);
        return; // Skip sending email
      }

      await sendOtpEmail(secureEmailTarget, rawOtp);
      console.log(`[Local Dev] OTP for ${secureEmailTarget}: ${rawOtp}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error("[AuthService] OTP processing failed:", error);
    }
  }

  // 👇 2. VERIFY OTP (ADDED) ──
  async verifyOtpAndLogin(email: string, requestedRole: AppRole, providedOtp: string) {
    // 1. Hash email to find user securely
    const searchHash = blindIndex(email);
    const adminRecord = await this.adminRepo.findAdminByEmail(searchHash);

    if (!adminRecord) {
      throw new ApiError("Invalid email or OTP verification code.", 400);
    }

    // ─── OTP Bypass for Demo Account (Backend Verified) ───
    const demoEmail = process.env.DEMO_EMAIL || "democfo@gmail.com";
    const demoOtp = process.env.DEMO_OTP || "000000";

    if (email === demoEmail && providedOtp === demoOtp) {
      // Magic bypass confirmed by backend
    } else {
      // 2. Fetch OTP Hash from Redis using the secure ID key
      const otpKey = generateRedisKey("OTP_HASH", adminRecord.id);
      const storedHashedOtp = await redisClient.get(otpKey);
      
      if (!storedHashedOtp) {
        throw new ApiError("OTP has expired. Please request a new one.", 400);
      }

      // 3. Hash user input and compare
      const hashedProvidedOtp = generateCrypto(providedOtp);
      if (storedHashedOtp !== hashedProvidedOtp) {
        throw new ApiError("Invalid OTP verification code.", 400);
      }

      // 5. Burn the OTP immediately
      await redisClient.del(otpKey);
    }

    // 4. Verify Role
    const actualRole = decryptRole(adminRecord.roleEncrypted);
    
    // For the demo account, we allow any role selection to facilitate testing and presentation.
    if (email !== demoEmail && actualRole !== requestedRole) {
      throw new ApiError("Access Denied: Insufficient privileges.", 403);
    }

    const finalRole = (email === demoEmail) ? requestedRole : actualRole;

    // 6. Generate JWT
    const jwtSecret = process.env.JWT_ACCESS_SECRET;
    const jwtExpiration = process.env.JWT_ACCESS_EXPIRATION || "8h";
    
    if (!jwtSecret) throw new ApiError("Server configuration error", 500);

    const plainEmail = decryptEmail(adminRecord.emailEncrypted);
    const token = jwt.sign(
      { userId: adminRecord.id, email: plainEmail, role: finalRole },
      jwtSecret,
      { expiresIn: jwtExpiration as any }
    );

    return { 
      admin: { id: adminRecord.id, email: plainEmail, role: actualRole }, 
      token 
    };
  }
}