import prisma from '../../config/db';

export class ArchiveService {
  static async getArchives(organizationId: string) {
    return prisma.fiscalArchive.findMany({
      where: { organizationId },
      orderBy: { year: 'desc' }
    });
  }

  static async createArchive(organizationId: string, data: {
    year: string;
    totalRevenue: number;
    totalExpenses: number;
    netMargin: number;
    growth?: string;
    auditStatus?: string;
  }) {
    return prisma.fiscalArchive.create({
      data: {
        organizationId,
        year: data.year,
        totalRevenue: data.totalRevenue,
        totalExpenses: data.totalExpenses,
        netMargin: data.netMargin,
        growth: data.growth,
        auditStatus: data.auditStatus || "Archived",
      }
    });
  }
}
