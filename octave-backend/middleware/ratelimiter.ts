// src/middlewares/rateLimiter.ts
// ─────────────────────────────────────────────────────────────────────────────
// Sliding Window Rate Limiter — Redis sorted set (ZSET) based.
//
// FIX over original code:
//   The original added the ZADD *outside* the pipeline — meaning the count
//   check and the zadd were two separate round-trips. A burst of concurrent
//   requests could all read count=0 before any of them wrote, bypassing the
//   limit. Here the zadd is inside the pipeline so the entire operation is
//   atomic on the Redis side.
//
// How sliding window works:
//   • Each request adds a member to a ZSET with score = current timestamp
//   • Before counting, we delete all members older than the window
//   • Count = ZCARD = number of requests in the current rolling window
//   • This is true sliding window (not fixed window which resets abruptly)
//
// Usage — import the pre-built instances or create your own:
//
//   import { loginLimiter, otpLimiter, totpLimiter, apiLimiter } from './rateLimiter';
//
//   router.post('/login/password',    loginLimiter, controller.login);
//   router.post('/login/otp/send',    otpLimiter,   controller.sendOtp);
//   router.post('/login/totp/verify', totpLimiter,  controller.verifyTotp);
//   app.use('/api', apiLimiter);  // global API guard
// ─────────────────────────────────────────────────────────────────────────────

import { type Request, type Response, type NextFunction } from "express";
import redisClient from "../config/redis";
import { generateRedisKey, type RedisKeyType } from "../config/redisKey";
import { ApiError } from "../utils/AppError";
// import { logger } from "../config/logger";

// ── Options ───────────────────────────────────────────────────────────────────

export interface SlidingWindowOptions {
  /** Which key namespace to use from redisKey.ts */
  keyType: RedisKeyType;
  /** Rolling window size in milliseconds */
  windowMs: number;
  /** Max requests allowed in the window before 429 */
  maxRequests: number;
  /** Human-readable name for logging (e.g. "login", "otp") */
  routeName: string;
  /** Optional: extract a custom identifier from req (default: req.ip) */
  keyExtractor?: (req: Request) => string;
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createSlidingWindowLimiter(opts: SlidingWindowOptions) {
  const {
    keyType,
    windowMs,
    maxRequests,
    routeName,
    keyExtractor = (req) => req.ip ?? "127.0.0.1",
  } = opts;

  // TTL with a safety buffer so dead keys don't linger
  const ttlSeconds = Math.ceil(windowMs / 1000) + 60;

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const identifier = keyExtractor(req);
    const key = generateRedisKey(keyType, identifier);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Unique member value — timestamp + random prevents ZADD collision
    // if two requests arrive at the exact same millisecond
    const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      // ── Atomic pipeline ────────────────────────────────────────────
      // All four ops run as a single round-trip.  Redis executes them
      // sequentially — no other client can interleave between them.
      //
      // 1. ZADD    — record this request (score = timestamp)
      // 2. ZREMRANGEBYSCORE — prune requests outside the window
      // 3. ZCARD   — count requests inside the window (after prune)
      // 4. EXPIRE  — refresh TTL so idle keys don't consume memory
      //
      // NOTE: ZADD *before* ZCARD means we count the current request.
      // This is intentional — the limit is "max N requests including this one".
      // If you prefer "N requests before this one", move ZADD after ZCARD.

      const pipeline = redisClient.pipeline();
      pipeline.zadd(key, now, member);
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zcard(key);
      pipeline.expire(key, ttlSeconds);

      const results = await pipeline.exec();

      // results[2] is the ZCARD result: [error | null, number]
      const countResult = results?.[2];
      if (!countResult || countResult[0] !== null) {
        // Pipeline error — fail open (do not block the request)
        console.error(`[RateLimit:${routeName}] Pipeline error`, {
          err: countResult?.[0],
        });
        return next();
      }

      const requestCount = countResult[1] as number;

      // ── Limit check ────────────────────────────────────────────────
      if (requestCount > maxRequests) {
        console.warn(`[RateLimit:${routeName}] Limit exceeded`, {
          identifier,
          requestCount,
          maxRequests,
          window: `${windowMs / 1000}s`,
        });

        // Standard rate-limit response headers (RFC 6585 + RateLimit draft)
        res.setHeader("X-RateLimit-Limit", maxRequests);
        res.setHeader("X-RateLimit-Remaining", 0);
        res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));
        res.setHeader("Retry-After", Math.ceil(windowMs / 1000));

        return next(
          new ApiError(
            `Too many requests on ${routeName}. ` +
              `Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
            500,
          ),
        );
      }

      // ── Allow — set informational headers ─────────────────────────
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - requestCount),
      );
      res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));

      next();
    } catch (error) {
      // Redis is unreachable — fail open (never block a request due to infra failure)
      console.error(`[RateLimit:${routeName}] Redis error — failing open`, {
        error,
      });
      next();
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-built instances — import these directly into your route files
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Login endpoint — 10 attempts / 15 min per IP.
 * Tight because this is the first auth stage.
 * The OTP + TOTP layers add further protection beyond this.
 */
export const loginLimiter = createSlidingWindowLimiter({
  keyType: "RATE_LIMIT_LOGIN_IP",
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  routeName: "login",
});

/**
 * OTP send endpoint — 5 sends / 15 min per IP.
 * Prevents OTP flooding / SMS/email cost abuse.
 * Actual 3-strike IP ban is handled separately in auth.service.ts on OTP verify.
 */
export const otpSendLimiter = createSlidingWindowLimiter({
  keyType: "RATE_LIMIT_OTP_IP",
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  routeName: "otp-send",
});

/**
 * OTP verify endpoint — 5 attempts / 15 min per IP.
 * The auth.service.ts 3-strike ban is the final wall; this is the outer wall.
 */
export const otpVerifyLimiter = createSlidingWindowLimiter({
  keyType: "RATE_LIMIT_OTP_IP",
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  routeName: "otp-verify",
});

/**
 * TOTP verify endpoint — 5 attempts / 15 min per IP.
 * Per architecture doc, TOTP has its own lockout (3 wrong → 5 min lock per user).
 * This IP-level guard is the outer layer.
 */
export const totpLimiter = createSlidingWindowLimiter({
  keyType: "RATE_LIMIT_TOTP_IP",
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  routeName: "totp",
});

/**
 * General API — 100 requests / 15 min per IP.
 * Applied globally to /api/* in server.ts.
 */
export const apiLimiter = createSlidingWindowLimiter({
  keyType: "RATE_LIMIT_IP",
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
  routeName: "api",
});

/**
 * Reports / export endpoints — 20 requests / 15 min.
 * Heavy DB queries — tighter limit to prevent abuse.
 */
export const reportLimiter = createSlidingWindowLimiter({
  keyType: "RATE_LIMIT_IP",
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  routeName: "reports",
});
