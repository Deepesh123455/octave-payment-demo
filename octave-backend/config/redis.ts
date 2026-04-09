import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const MAX_RETRY_ATTEMPTS = 10;

const isSecure = REDIS_URL.startsWith("rediss://");

type RedisClientOptions = {
  lazyConnect?: boolean;
};

export const createRedisClient = (
  connectionName = "octave-backend",
  options: RedisClientOptions = {},
) => {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    tls: isSecure ? { rejectUnauthorized: false } : undefined,
    retryStrategy(times: number) {
      if (times > MAX_RETRY_ATTEMPTS) {
        console.error(
          `[Redis:${connectionName}] Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Giving up.`,
        );
        return null;
      }

      const delay = Math.min(times * 100, 3_000);
      console.warn(`[Redis:${connectionName}] Retry attempt ${times} in ${delay}ms...`);
      return delay;
    },
    enableOfflineQueue: false,
    keepAlive: 10_000,
    connectionName,
    lazyConnect: options.lazyConnect ?? false,
  });

  client.on("connect", () => console.log(`[Redis:${connectionName}] Connecting...`));
  client.on("ready", () => console.log(`[Redis:${connectionName}] Connected and ready`));
  client.on("error", (err: Error) =>
    console.error(`[Redis:${connectionName}] Error:`, err.message),
  );
  client.on("close", () => console.warn(`[Redis:${connectionName}] Connection closed`));
  client.on("reconnecting", () =>
    console.warn(`[Redis:${connectionName}] Reconnecting...`),
  );
  client.on("end", () => console.warn(`[Redis:${connectionName}] Connection ended`));

  return client;
};

const redisClient = createRedisClient();

export default redisClient;
