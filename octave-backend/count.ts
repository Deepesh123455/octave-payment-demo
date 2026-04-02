import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const rentCount = await prisma.rentPayment.count();
  const utilCount = await prisma.utilityBill.count();
  const pcCount = await prisma.pettyCashRequest.count();
  const transCount = await prisma.tallyImportRecord.count();
  const storeCount = await prisma.store.count();
  console.log(`Rent: ${rentCount}`);
  console.log(`Utility: ${utilCount}`);
  console.log(`Petty Cash: ${pcCount}`);
  console.log(`Transactions: ${transCount}`);
  console.log(`Stores: ${storeCount}`);
  process.exit(0);
}
main();
