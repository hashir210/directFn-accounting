import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[backfill]: Starting data migration...');

  // 1. Get first user to be the owner
  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!firstUser) {
    console.log('[backfill]: No users found. Skipping backfill.');
    return;
  }

  // 2. Create Legacy Organization
  let org = await prisma.organization.findFirst({
    where: { name: 'Legacy Organization' }
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Legacy Organization',
        ownerId: firstUser.id,
      },
    });
    console.log(`[backfill]: Created Legacy Organization (ID: ${org.id})`);
  }

  // 3. Create basic roles
  let ownerRole = await prisma.role.findFirst({
    where: { organizationId: org.id, name: 'Owner' }
  });
  if (!ownerRole) {
    ownerRole = await prisma.role.create({
      data: { organizationId: org.id, name: 'Owner', isSystemRole: true }
    });
  }

  let managerRole = await prisma.role.findFirst({
    where: { organizationId: org.id, name: 'Manager' }
  });
  if (!managerRole) {
    managerRole = await prisma.role.create({
      data: { organizationId: org.id, name: 'Manager', isSystemRole: true }
    });
  }

  let staffRole = await prisma.role.findFirst({
    where: { organizationId: org.id, name: 'Staff' }
  });
  if (!staffRole) {
    staffRole = await prisma.role.create({
      data: { organizationId: org.id, name: 'Staff', isSystemRole: true }
    });
  }

  // 4. Update all Users
  const users = await prisma.user.findMany();
  for (const user of users) {
    let assignedRoleId = staffRole.id;
    // @ts-ignore
    const legacy = (user as any).legacyRole;
    if (legacy === 'admin') assignedRoleId = ownerRole.id;
    if (legacy === 'manager') assignedRoleId = managerRole.id;
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: org.id,
        roleId: assignedRoleId,
      }
    });
  }
  console.log(`[backfill]: Updated ${users.length} users with organizationId & roleId.`);

  // 5. Update other entities
  const updatePromises = [
    prisma.customer.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id }
    }),
    prisma.invoice.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id }
    }),
    prisma.expense.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id }
    }),
    prisma.product.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id }
    }),
    prisma.bankAccount.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id }
    }),
    prisma.notification.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id }
    }),
  ];

  await Promise.all(updatePromises);
  console.log('[backfill]: Updated other entities (customers, invoices, expenses, products, bankAccounts, notifications).');
  
  console.log('[backfill]: Data migration complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
