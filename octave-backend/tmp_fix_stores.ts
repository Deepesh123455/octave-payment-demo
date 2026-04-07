import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function fixBalance() {
  console.log("🔧 Resetting petty cash balance for STO001 to ₹25,000 using raw SQL...");
  
  // Use raw SQL to bypass stale Prisma client types
  await prisma.$executeRaw`
    UPDATE stores 
    SET "pettyCashBalance" = 25000 
    WHERE "storeId" = 'STO001'
  `;
  
  const result: any[] = await prisma.$queryRaw`
    SELECT "storeId", "storeName", "pettyCashBalance" 
    FROM stores 
    WHERE "storeId" = 'STO001'
  `;
  console.log("✅ Balance updated:", result[0]);
}

fixBalance()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
