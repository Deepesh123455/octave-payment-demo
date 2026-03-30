// src/routes/auth.routes.ts
import { Router } from "express";
import { prisma } from "../config/db"; // Ensure your Prisma client is imported correctly
import { AdminRepository } from "../repository/auth.repository";
import { AuthService } from "../service/auth.service";
import { AuthController } from "../controller/auth.controller";
import { captchaMiddleware } from "../middleware/hcaptcha";
import { otpSendLimiter } from "../middleware/ratelimiter";
import { otpSpeedLimiter } from "../middleware/speedlimiter";
import { sendOtpValidation, verifyOtpValidation } from "../validation/otpValidation";
import { validate } from "../middleware/zodValidation";

const router = Router();

// 1. Dependency Injection setup
const adminRepo = new AdminRepository(prisma);
const authService = new AuthService(adminRepo);
const authController = new AuthController(authService);

// 2. Define the route
router.post(
  "/login/otp/send",
  otpSpeedLimiter,
  validate(sendOtpValidation),
  otpSendLimiter,
 
  authController.sendOtp,
);

router.post(
  "/login/otp/verify",
  validate(verifyOtpValidation),
  authController.verifyOtp,
)



export default router;
