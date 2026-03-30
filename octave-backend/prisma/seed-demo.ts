// prisma/seed-demo.ts
import { PrismaClient } from "@prisma/client";
import { encryptEmail, encryptRole, blindIndex } from "../utils/crypto";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

async function main() {
  console.log("🚀 Seeding standalone democfo user...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const rawEmail = "democfo@gmail.com";
    const rawRole = "SUPER_ADMIN";

    const emailHash = blindIndex(rawEmail);
    const emailEncrypted = encryptEmail(rawEmail);
    const roleEncrypted = encryptRole(rawRole as any);

    await prisma.admin.upsert({
      where: { emailHash },
      update: {
        emailEncrypted,
        roleEncrypted,
      },
      create: {
        emailHash,
        emailEncrypted,
        roleEncrypted,
      },
    });

    console.log("✅ Successfully seeded democfo@gmail.com as SUPER_ADMIN.");
  } catch (error) {
    console.error("❌ Failed to seed demo user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
