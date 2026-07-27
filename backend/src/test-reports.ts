import prisma from './config/db';
import { ReportsService } from './modules/reports/reports.service';

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log("No organization found");
    return;
  }
  
  try {
    const data = await ReportsService.getSalesReport(org.id);
    console.log("SUCCESS:", JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error("ERROR:", err);
  }
}

main().finally(() => process.exit(0));
