// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { IAuthService } from "../interfaces/auth.interface";

export class AuthController {
  constructor(private authService: IAuthService) {}

  // Existing Send OTP method
  sendOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, role } = req.body;
      await this.authService.processOtpRequest(email, role);
      res
        .status(200)
        .json({
          success: true,
          message: "If the email and role match, an OTP has been sent.",
        });
    } catch (error) {
      next(error);
    }
  };

  // 👇 ADDED: New Verify OTP method
  verifyOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { email, role, otp } = req.body;

      const { admin, token } = await this.authService.verifyOtpAndLogin(
        email,
        role,
        otp,
      );

      res.status(200).json({
        success: true,
        message: "Authentication successful",
        data: { token, admin },
      });
    } catch (error) {
      next(error); // Passes the ApiError to your global Express error handler
    }
  };
}
