import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const orgId = 'org-finflow';
  const supplier1 = await prisma.supplier.create({ data: { organizationId: orgId, name: 'AWS Cloud Services', category: 'Cloud Infrastructure', contactEmail: 'billing@aws.com', phone: '+1 800 123 4567', paymentTerms: 'Net 30', dueAmount: 5000 } });
  const supplier2 = await prisma.supplier.create({ data: { organizationId: orgId, name: 'Google Workspace', category: 'Software', contactEmail: 'billing@google.com', phone: '+1 800 987 6543', paymentTerms: 'Net 15', dueAmount: 0 } });
  const supplier3 = await prisma.supplier.create({ data: { organizationId: orgId, name: 'GitHub Enterprise', category: 'Software', contactEmail: 'billing@github.com', phone: '+1 800 555 1234', paymentTerms: 'Net 30', dueAmount: 1200 } });

  await prisma.purchaseBill.create({ data: { organizationId: orgId, supplierId: supplier1.id, billNo: 'AWS-2024-001', amount: 5000, paidAmount: 0, status: 'Pending', dueDate: new Date(new Date().setDate(new Date().getDate() + 15)) } });
  await prisma.purchaseBill.create({ data: { organizationId: orgId, supplierId: supplier2.id, billNo: 'GCP-2024-002', amount: 800, paidAmount: 800, status: 'Paid', dueDate: new Date(new Date().setDate(new Date().getDate() - 5)) } });
  await prisma.purchaseBill.create({ data: { organizationId: orgId, supplierId: supplier3.id, billNo: 'GH-2024-003', amount: 1200, paidAmount: 0, status: 'Pending', dueDate: new Date(new Date().setDate(new Date().getDate() + 10)) } });
  console.log('Mock purchase data added!');
}
run().catch(console.error).finally(() => prisma.$disconnect());
