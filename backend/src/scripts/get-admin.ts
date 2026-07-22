import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true, organization: true },
  });

  console.log('--- Current Registered Users in DB ---');
  for (const u of users) {
    console.log(`- ID: ${u.id} | Email: ${u.email} | Name: ${u.name} | Role: ${u.role?.name || 'No Role'} | Verified: ${u.isVerified} | Org: ${u.organization?.name} (Platform: ${u.organization?.isPlatform})`);
  }

  const defaultPassword = 'Admin123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Find or create Platform Organization first
  let org = await prisma.organization.findFirst({ where: { isPlatform: true } });
  if (!org) {
    org = await prisma.organization.findFirst();
  }

  let admin = await prisma.user.findFirst({ where: { email: 'admin@finflow.com' } });

  if (!org) {
    // Create org and user together
    org = await prisma.organization.create({
      data: {
        name: 'DirectFN HQ',
        isPlatform: true,
        status: 'ACTIVE',
        owner: {
          create: {
            email: 'admin@finflow.com',
            name: 'Platform Admin',
            password: hashedPassword,
            isVerified: true,
          },
        },
      },
      include: { owner: true },
    });
    admin = org.owner as any;
  } else {
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'admin@finflow.com',
          name: 'Platform Admin',
          password: hashedPassword,
          isVerified: true,
          organizationId: org.id,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: admin.id },
        data: { password: hashedPassword, isVerified: true },
      });
    }
  }

  let adminRole = await prisma.role.findFirst({ where: { name: 'Admin', organizationId: org.id } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'Admin',
        organizationId: org.id,
        description: 'Full Platform Administrator',
      },
    });
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: {
      organizationId: org.id,
      roleId: adminRole.id,
    },
  });

  console.log('\n==========================================');
  console.log('       FINFLOW ADMIN CREDENTIALS          ');
  console.log('==========================================');
  console.log(`Email:       admin@finflow.com`);
  console.log(`Password:    ${defaultPassword}`);
  console.log(`Role:        Admin`);
  console.log(`Organization: ${org.name}`);
  console.log('==========================================');
}

main()
  .catch((err) => console.error(err))
  .finally(async () => {
    await prisma.$disconnect();
  });

