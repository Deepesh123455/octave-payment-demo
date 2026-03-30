import { z } from "zod";

const ALLOWED_ROLES = ["SUPER_ADMIN", "FINANCE_ADMIN", "EXPENSE_VIEWER"] as const;

// 1. Create a base schema for the fields they share
const baseAuthFields = {
  email: z
    .string()
    .email("Please enter a valid email")
    .min(1, "Email is required"),

  role: z.enum(ALLOWED_ROLES, {
    required_error: "Role is required",
    invalid_type_error: "Invalid role selected",
  }),
};

// 2. Schema for Route 1: Requesting the OTP
export const sendOtpValidation = z.object({
  body: z.object({
    ...baseAuthFields,
    // Zod acts as the first line of defense before the middleware
  }),
});

// 3. Schema for Route 2: Verifying the OTP
export const verifyOtpValidation = z.object({
  body: z.object({
    ...baseAuthFields,
    // Strict validation for exactly 6 digits
    otp: z
      .string({ required_error: "OTP is required" })
      .length(6, "OTP must be exactly 6 digits")
      .regex(/^\d+$/, "OTP must contain only numbers"),
  }),
});
