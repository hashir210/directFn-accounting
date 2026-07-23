import prisma from '../config/db';

async function main() {
  const org = await prisma.organization.findFirst({
    where: { name: { contains: 'DirectFN' } },
    select: { id: true, name: true, disabledScreens: true, isPlatform: true }
  });
  console.log('DirectFN Org Disabled Screens:', org?.disabledScreens);
}

main().finally(() => prisma.$disconnect());
