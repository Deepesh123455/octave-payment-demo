import { PrismaClient } from "@prisma/client";
import "dotenv/config";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
  log: ['warn', 'error']
});

prisma.$connect()
  .then(() => console.log("[DB] ✅ Connected!"))
  .catch((err: any) => console.error("[DB] ❌ Failed:", err.message));