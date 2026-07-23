import prisma from '../config/db';
import * as bcrypt from 'bcrypt';

async function main() {
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=0;`);

  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if admin user exists
  const admin = await prisma.user.findFirst({ where: { email: 'admin@finflow.com' } });

  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword, emailVerified: true },
    });
  } else {
    console.log('Admin user missing, please run npm run seed');
  }

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS=1;`);

  console.log('==========================================');
  console.log('      FINFLOW ADMIN CREDENTIALS           ');
  console.log('==========================================');
  console.log(`Email:       admin@finflow.com`);
  console.log(`Password:    Password123!`);
  console.log(`Role:        Platform Administrator`);
  console.log('==========================================');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
