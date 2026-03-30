import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const MAX_RETRY_ATTEMPTS = 10;

const isSecure = REDIS_URL.startsWith("rediss://");

const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,

  tls: isSecure ? { rejectUnauthorized: false } : undefined,
  retryStrategy(times: number) {
    if (times > MAX_RETRY_ATTEMPTS) {
      console.error(
        `[Redis] ❌ Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Giving up.`,
      );
      return null;
    }
    const delay = Math.min(times * 100, 3_000);
    console.warn(`[Redis] 🔄 Retry attempt ${times} in ${delay}ms...`);
    return delay;
  },

  // Prevent commands queuing up indefinitely if Redis is down at startup
  enableOfflineQueue: false,

  // Keep-alive to detect stale connections behind NAT / load balancers
  keepAlive: 10_000,

  // Connection name — visible in Redis CLIENT LIST, useful for debugging
  connectionName: "octave-backend",
});

redisClient.on("connect", () => console.log("[Redis] 🔌 Connecting..."));
redisClient.on("ready", () => console.log("[Redis] ✅ Connected and ready"));
redisClient.on("error", (err: Error) =>
  console.error("[Redis] ❌ Error:", err.message),
);
redisClient.on("close", () => console.warn("[Redis] ⚠️  Connection closed"));
redisClient.on("reconnecting", () =>
  console.warn("[Redis] 🔄 Reconnecting..."),
);
redisClient.on("end", () => console.warn("[Redis] 🔴 Connection ended"));

export default redisClient;
