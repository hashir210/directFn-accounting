import prisma from '../config/db';
import bcrypt from 'bcrypt';

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true, organization: true },
  });

  console.log('--- Current Registered Users in DB ---');
  for (const u of users) {
    console.log(`- ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | Role: ${u.role?.name || 'No Role'} | Verified: ${u.emailVerified} | Org: ${u.organization?.name} (Platform: ${u.organization?.isPlatform})`);
  }

  const defaultPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  let org = await prisma.organization.findFirst({ where: { isPlatform: true } });
  if (!org) {
    org = await prisma.organization.findFirst();
  }

  let admin = await prisma.user.findFirst({ where: { email: 'admin@finflow.com' } });

  if (org && admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword, emailVerified: true },
    });
  }

  console.log('\n==========================================');
  console.log('       FINFLOW ADMIN CREDENTIALS          ');
  console.log('==========================================');
  console.log(`Email:       admin@finflow.com`);
  console.log(`Password:    ${defaultPassword}`);
  console.log(`Role:        Admin`);
  console.log(`Organization: ${org?.name || 'FinFlow HQ'}`);
  console.log('==========================================');
}

main()
  .catch((err) => console.error(err))
  .finally(async () => {
    await prisma.$disconnect();
  });
