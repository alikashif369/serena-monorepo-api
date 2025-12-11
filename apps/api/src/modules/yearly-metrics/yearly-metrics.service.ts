import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class YearlyMetricsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: any) {
    const where: any = {};

    if (query?.siteId) where.siteId = parseInt(query.siteId);
    if (query?.year) where.year = parseInt(query.year);
    if (query?.minYear) where.year = { gte: parseInt(query.minYear) };
    if (query?.maxYear) where.year = { lte: parseInt(query.maxYear) };

    return this.prisma.yearlyMetrics.findMany({
      where,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        baseRaster: {
          select: {
            id: true,
            fileName: true,
            createdAt: true,
          },
        },
        classifiedRaster: {
          select: {
            id: true,
            fileName: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ siteId: 'asc' }, { year: 'desc' }],
    });
  }

  async findBySiteAndYear(siteId: number, year: number) {
    const metrics = await this.prisma.yearlyMetrics.findFirst({
      where: {
        siteId,
        year,
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                region: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        baseRaster: true,
        classifiedRaster: true,
      },
    });

    if (!metrics) {
      throw new NotFoundException(`Metrics for site ${siteId} and year ${year} not found`);
    }

    return metrics;
  }

  async findBySite(siteId: number, years?: number[]) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    const where: any = { siteId };
    if (years && years.length > 0) {
      where.year = { in: years };
    }

    return this.prisma.yearlyMetrics.findMany({
      where,
      include: {
        baseRaster: {
          select: {
            id: true,
            fileName: true,
            minioUrl: true,
            createdAt: true,
          },
        },
        classifiedRaster: {
          select: {
            id: true,
            fileName: true,
            minioUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: { year: 'desc' },
    });
  }
}
