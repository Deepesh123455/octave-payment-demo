import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Checking Rent and Stores data...");
  const firstApprovedRent = await prisma.rentPayment.findFirst({
    where: { status: 'Approved' },
    include: { store: true }
  });
  
  if (firstApprovedRent) {
    console.log("Approved Rent Record Found:");
    console.log("ID:", firstApprovedRent.id);
    console.log("Amount:", firstApprovedRent.amount);
    console.log("Net Payable:", firstApprovedRent.netPayable);
    if (firstApprovedRent.store) {
        console.log("Store Monthly Rent:", firstApprovedRent.store.monthlyRent);
    } else {
        console.log("No store joined!");
    }
  } else {
    console.log("No approved rent payments found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
