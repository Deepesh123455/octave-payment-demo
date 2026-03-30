// src/middlewares/captcha.ts
// ─────────────────────────────────────────────────────────────────────────────
// hCaptcha verification middleware.
//
// How it works:
//   1. Frontend calls window.hcaptcha.execute() → gets a token string
//   2. Frontend sends { captchaToken: "..." } in the request body
//   3. This middleware POSTs that token to hCaptcha's siteverify API
//   4. hCaptcha responds with { success: true/false, score: 0.0–1.0 }
//   5. Score < SCORE_THRESHOLD → block the request (bot detected)
//   6. Score >= SCORE_THRESHOLD → call next() (human confirmed)
//
// Setup:
//   1. Register at hcaptcha.com → get your sitekey + secret key
//   2. Add to .env:
//        HCAPTCHA_SECRET=your_secret_key_here
//        HCAPTCHA_SCORE_THRESHOLD=0.7   (optional, defaults to 0.5)
//   3. On your frontend, load the hCaptcha script and call execute()
//      before submitting the login form:
//        <script src="https://js.hcaptcha.com/1/api.js" async defer></script>
//
// Wire in auth routes (BEFORE password/OTP validation):
//   router.post('/login/otp/send', otpSpeedLimiter, otpSendLimiter, captchaMiddleware, ...)
// ─────────────────────────────────────────────────────────────────────────────

import { type Request, type Response, type NextFunction } from "express";
import { ApiError } from "../utils/AppError";
import "dotenv/config";

const HCAPTCHA_VERIFY_URL = "https://api.hcaptcha.com/siteverify";
const SCORE_THRESHOLD     = parseFloat(process.env.HCAPTCHA_SCORE_THRESHOLD ?? "0.5");

// ── Main middleware ───────────────────────────────────────────────────────────

export const captchaMiddleware = async (
  req:  Request,
  res:  Response,
  next: NextFunction,
): Promise<void> => {

  // Skip CAPTCHA in test environment so automated tests don't need real tokens
  if (process.env.NODE_ENV === "test") {
    return next();
  }

  const secret = process.env.HCAPTCHA_SECRET;
  if (!secret) {
    // Misconfiguration — crash loudly in development, fail open in production
    if (process.env.NODE_ENV === "development") {
      throw new Error("[captcha] HCAPTCHA_SECRET is not set in environment variables.");
    }
    console.error("[captcha] HCAPTCHA_SECRET missing — skipping captcha check");
    return next();
  }

  // ── Extract token from request body ──────────────────────────────
  const token = req.body?.captchaToken as string | undefined;

  if (!token || token.trim() === "") {
    return next(new ApiError("CAPTCHA token is required.", 400));
  }

  try {
    // ── POST to hCaptcha siteverify API ───────────────────────────
    const formBody = new URLSearchParams({
      secret,
      response: token,
      remoteip: req.ip ?? "",   // optional but improves accuracy
    });

    const response = await fetch(HCAPTCHA_VERIFY_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    formBody.toString(),
    });

    if (!response.ok) {
      // hCaptcha API itself returned an HTTP error — fail open
      console.error(`[captcha] hCaptcha API error: HTTP ${response.status}`);
      return next();
    }

    const data = (await response.json()) as {
      success:     boolean;
      score?:      number;
      "error-codes"?: string[];
    };

    // ── Bot detected ──────────────────────────────────────────────
    if (!data.success) {
      console.warn("[captcha] Verification failed", {
        ip:         req.ip,
        errorCodes: data["error-codes"],
      });
      return next(new ApiError("CAPTCHA verification failed. Please try again.", 403));
    }

    // ── Score check (hCaptcha Enterprise) ─────────────────────────
    // Non-enterprise hCaptcha does not return a score — data.score will be
    // undefined. The score check only applies if a score is present.
    if (data.score !== undefined && data.score < SCORE_THRESHOLD) {
      console.warn("[captcha] Score below threshold", {
        ip:        req.ip,
        score:     data.score,
        threshold: SCORE_THRESHOLD,
      });
      return next(
        new ApiError(
          `Suspicious activity detected (score: ${data.score}). Please try again.`,
          403,
        )
      );
    }

    // ── Human confirmed ───────────────────────────────────────────
    // Attach score to req so downstream middleware/controllers can log it
    (req as any).captchaScore = data.score ?? 1.0;

    next();

  } catch (error) {
    // Network error reaching hCaptcha — fail open (don't block users for our infra issues)
    console.error("[captcha] Network error contacting hCaptcha — failing open", error);
    next();
  }
};