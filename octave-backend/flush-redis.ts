import { Redis } from "ioredis";
import "dotenv/config";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const isSecure = REDIS_URL.startsWith("rediss://");

async function flush() {
  console.log("Connecting to Redis...");
  const redis = new Redis(REDIS_URL, {
    tls: isSecure ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await redis.flushall();
    console.log("✅ Redis cache flushed successfully!");
    process.exit(0);
  } catch (e) {
    console.error("❌ Flush failed:", e);
    process.exit(1);
  }
}

flush();
