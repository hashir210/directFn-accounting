import prisma from '../config/db';

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'owner@directfn.com' },
  });

  console.log('=== User owner@directfn.com ===');
  console.log('User ID:', user?.id);
  console.log('User Org ID:', user?.organizationId);

  if (user?.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId }
    });
    console.log('Found Org by User Org ID:', org);
  }

  const allOrgs = await prisma.organization.findMany();
  console.log('All Orgs in DB:', allOrgs);
}

main().finally(() => prisma.$disconnect());
