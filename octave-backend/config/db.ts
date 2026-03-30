import { PrismaClient } from "@prisma/client";
import "dotenv/config";

export const prisma = new PrismaClient({
  log: ['warn', 'error']
});

prisma.$connect()
  .then(() => console.log("[DB] ✅ Connected!"))
  .catch((err: any) => console.error("[DB] ❌ Failed:", err.message));