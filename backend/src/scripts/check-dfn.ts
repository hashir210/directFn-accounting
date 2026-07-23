import prisma from '../config/db';

async function main() {
  const org = await prisma.organization.findFirst({
    where: { name: { contains: 'DirectFN' } },
    include: {
      users: { select: { email: true, role: { select: { name: true } } } },
      invoices: true,
      expenses: true,
      products: true,
      customers: true,
      suppliers: true,
    }
  });

  if (!org) {
    console.log('DirectFN organization NOT FOUND');
    return;
  }

  console.log('=== DirectFN Org Found ===');
  console.log('ID:', org.id);
  console.log('Name:', org.name);
  console.log('Users:', org.users);
  console.log('Invoices Count:', org.invoices.length);
  console.log('Expenses Count:', org.expenses.length);
  console.log('Products Count:', org.products.length);
  console.log('Customers Count:', org.customers.length);
  console.log('Suppliers Count:', org.suppliers.length);
}

main().finally(() => prisma.$disconnect());
