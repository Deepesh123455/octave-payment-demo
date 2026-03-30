
import { PrismaClient } from '@prisma/client';
import { decryptEmail, decryptRole } from './utils/crypto';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.admin.findMany();
  const decryptedAdmins = admins.map(a => ({
    id: a.id,
    email: decryptEmail(a.emailEncrypted),
    role: decryptRole(a.roleEncrypted),
    createdAt: a.createdAt
  }));
  console.log(JSON.stringify(decryptedAdmins, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
