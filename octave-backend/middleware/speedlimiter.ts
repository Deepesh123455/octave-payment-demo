// src/middlewares/speedLimiter.ts

import { type Request, type Response, type NextFunction } from "express";
import redisClient from "../config/redis";
import { generateRedisKey } from "../config/redisKey";
import { ApiError } from "../utils/AppError";

export interface SpeedLimiterOptions {
  windowMs: number;
  delayAfter: number;
  baseDelayMs: number;
  maxDelayMs: number;
  routeName: string;
  keyExtractor?: (req: Request) => string;
}

export function createSpeedLimiter(opts: SpeedLimiterOptions) {
  const {
    windowMs,
    delayAfter,
    baseDelayMs,
    maxDelayMs,
    routeName,
    keyExtractor = (req) => req.ip ?? "127.0.0.1",
  } = opts;

  const ttlSeconds = Math.ceil(windowMs / 1000) + 60;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const identifier = keyExtractor(req);
    const key = generateRedisKey(
      "SPEED_LIMIT_IP",
      `${routeName}:${identifier}`,
    );
    const now = Date.now();
    const windowStart = now - windowMs;
    const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      const pipeline = redisClient.pipeline();
      pipeline.zadd(key, now, member);
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zcard(key);
      pipeline.expire(key, ttlSeconds);

      const results = await pipeline.exec();
      const countResult = results?.[2];

      // ✅ FIX 1 — Pipeline error: fail open, don't throw.
      // Infrastructure errors must never block legitimate users.
      if (!countResult || countResult[0] !== null) {
        console.error(
          `[SpeedLimit:${routeName}] Pipeline error`,
          countResult?.[0],
        );
        return next();
      }

      const requestCount = countResult[1] as number;
      (req as any).speedLimitCount = requestCount;

      // Under threshold — no friction, pass through instantly
      if (requestCount <= delayAfter) {
        res.setHeader("X-Slow-Down-Limit", delayAfter);
        res.setHeader("X-Slow-Down-Current", requestCount);
        res.setHeader("X-Slow-Down-Delay", 0);
        return next();
      }

      // Over threshold — calculate progressive delay
      // 51st request (threshold=50) → (51-50) × 500ms = 500ms
      // 55th request               → (55-50) × 500ms = 2500ms
      // 60th+ request              → capped at maxDelayMs
      const overLimit = requestCount - delayAfter;
      const delay = Math.min(overLimit * baseDelayMs, maxDelayMs);

      res.setHeader("X-Slow-Down-Limit", delayAfter);
      res.setHeader("X-Slow-Down-Current", requestCount);
      res.setHeader("X-Slow-Down-Delay", delay);

      console.log(
        `[SpeedLimit:${routeName}] Throttling ${identifier} ` +
          `— ${delay}ms delay (request #${requestCount})`,
      );

      // ✅ FIX 2 — Await the delay, THEN call next().
      //
      // This is THE core mechanic of a speed limiter.
      // The request pauses here on the server and continues after the delay.
      //
      // DO NOT throw here. Throwing stops the request entirely (rate limiter
      // behaviour). Speed limiters slow requests down — they still go through.
      // The hard 429 block is rateLimiter.ts's job, not this file's.
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
      next();
    } catch (error) {
      // ✅ FIX 3 — Redis down: fail open by calling next(), never throw.
      //
      // Throwing here would return a 500 to every user while Redis is restarting.
      // That would take down the entire portal for a Redis blip.
      // The safe behaviour: let the request through without speed limiting.
      console.error(
        `[SpeedLimit:${routeName}] Redis error — failing open`,
        error,
      );
      next();
    }
  };
}

// ── Pre-built instances ───────────────────────────────────────────────────────

/**
 * Login speed limiter.
 * Throttle begins after 5 requests (well below the 10-request hard limit).
 * Requests 6–9 get 800ms, 1600ms, 2400ms, 3000ms delays respectively.
 * Legitimate users attempting login 1–2 times feel nothing.
 */
export const loginSpeedLimiter = createSpeedLimiter({
  windowMs: 15 * 60 * 1000,
  delayAfter: 5,
  baseDelayMs: 800,
  maxDelayMs: 3000,
  routeName: "login",
});

/**
 * OTP speed limiter.
 * OTP sends are expensive (email costs). Throttle after 3 sends.
 * Attempt 4 → 500ms, attempt 5 → 1000ms, attempt 6+ → 2000ms cap.
 */
export const otpSpeedLimiter = createSpeedLimiter({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  baseDelayMs: 500,
  maxDelayMs: 2000,
  routeName: "otp",
});

/**
 * General API speed limiter.
 * Throttle begins after 50 requests in 15 minutes.
 */
export const apiSpeedLimiter = createSpeedLimiter({
  windowMs: 15 * 60 * 1000,
  delayAfter: 200, // Increased to accommodate real-time polling (12 req/min * 15m = 180 req)
  baseDelayMs: 500,
  maxDelayMs: 3000,
  routeName: "api",
});
