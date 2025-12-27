import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateYearlyMetricsDto } from './dto/create-yearly-metrics.dto';
import { UpdateYearlyMetricsDto } from './dto/update-yearly-metrics.dto';

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

  async findOne(id: number) {
    const metrics = await this.prisma.yearlyMetrics.findUnique({
      where: { id },
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
      throw new NotFoundException(`YearlyMetrics with ID ${id} not found`);
    }

    return metrics;
  }

  async create(dto: CreateYearlyMetricsDto) {
    // Check if site exists
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
    }

    // Check for existing metrics for same site+year
    const existing = await this.prisma.yearlyMetrics.findFirst({
      where: {
        siteId: dto.siteId,
        year: dto.year,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Metrics for site ${dto.siteId} and year ${dto.year} already exist`,
      );
    }

    // Validate raster references if provided
    if (dto.baseRasterId) {
      const baseRaster = await this.prisma.raster.findUnique({
        where: { id: dto.baseRasterId },
      });
      if (!baseRaster) {
        throw new NotFoundException(`Base raster with ID ${dto.baseRasterId} not found`);
      }
    }

    if (dto.classifiedRasterId) {
      const classifiedRaster = await this.prisma.raster.findUnique({
        where: { id: dto.classifiedRasterId },
      });
      if (!classifiedRaster) {
        throw new NotFoundException(`Classified raster with ID ${dto.classifiedRasterId} not found`);
      }
    }

    return this.prisma.yearlyMetrics.create({
      data: dto,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        baseRaster: true,
        classifiedRaster: true,
      },
    });
  }

  async update(id: number, dto: UpdateYearlyMetricsDto) {
    // Check if metrics exist
    const existing = await this.prisma.yearlyMetrics.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`YearlyMetrics with ID ${id} not found`);
    }

    // Validate raster references if provided
    if (dto.baseRasterId) {
      const baseRaster = await this.prisma.raster.findUnique({
        where: { id: dto.baseRasterId },
      });
      if (!baseRaster) {
        throw new NotFoundException(`Base raster with ID ${dto.baseRasterId} not found`);
      }
    }

    if (dto.classifiedRasterId) {
      const classifiedRaster = await this.prisma.raster.findUnique({
        where: { id: dto.classifiedRasterId },
      });
      if (!classifiedRaster) {
        throw new NotFoundException(`Classified raster with ID ${dto.classifiedRasterId} not found`);
      }
    }

    return this.prisma.yearlyMetrics.update({
      where: { id },
      data: dto,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        baseRaster: true,
        classifiedRaster: true,
      },
    });
  }

  async delete(id: number) {
    const existing = await this.prisma.yearlyMetrics.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`YearlyMetrics with ID ${id} not found`);
    }

    return this.prisma.yearlyMetrics.delete({
      where: { id },
    });
  }

  async upsert(dto: CreateYearlyMetricsDto) {
    // Check if site exists
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found`);
    }

    return this.prisma.yearlyMetrics.upsert({
      where: {
        siteId_year: {
          siteId: dto.siteId,
          year: dto.year,
        },
      },
      create: dto,
      update: {
        treeCanopy: dto.treeCanopy,
        greenArea: dto.greenArea,
        barrenLand: dto.barrenLand,
        wetLand: dto.wetLand,
        snow: dto.snow,
        rock: dto.rock,
        water: dto.water,
        buildup: dto.buildup,
        solarPanels: dto.solarPanels,
        baseRasterId: dto.baseRasterId,
        classifiedRasterId: dto.classifiedRasterId,
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        baseRaster: true,
        classifiedRaster: true,
      },
    });
  }
}
