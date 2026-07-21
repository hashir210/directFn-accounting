import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE User DROP COLUMN role`);
  console.log('Dropped role column');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
