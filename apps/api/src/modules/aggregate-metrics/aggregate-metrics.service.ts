import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAggregateMetricDto } from './dto/create-aggregate-metric.dto';
import { UpdateAggregateMetricDto } from './dto/update-aggregate-metric.dto';

@Injectable()
export class AggregateMetricsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateAggregateMetricDto) {
    // Validate entity linkage
    this.validateEntityLinkage(dto);

    // Validate entity existence
    await this.validateEntityExists(dto);

    return this.prisma.aggregateMetrics.create({
      data: {
        ...dto,
        updatedById: userId
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true, type: true } }
      }
    });
  }

  async findAll(query?: {
    entityType?: string;
    organizationId?: number;
    regionId?: number;
    categoryId?: number;
    metricType?: string;
    year?: number;
  }) {
    const where: any = {};

    if (query?.entityType) where.entityType = query.entityType;
    if (query?.organizationId) where.organizationId = query.organizationId;
    if (query?.regionId) where.regionId = query.regionId;
    if (query?.categoryId) where.categoryId = query.categoryId;
    if (query?.metricType) where.metricType = query.metricType;

    // Year filtering (matches either year or falls within startYear-endYear range)
    if (query?.year) {
      where.OR = [
        { year: query.year },
        {
          AND: [
            { startYear: { lte: query.year } },
            { endYear: { gte: query.year } }
          ]
        }
      ];
    }

    return this.prisma.aggregateMetrics.findMany({
      where,
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true, type: true } }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });
  }

  async findOne(id: number) {
    const metric = await this.prisma.aggregateMetrics.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true, type: true } },
        updatedBy: { select: { id: true, name: true, email: true } }
      }
    });

    if (!metric) {
      throw new NotFoundException(`AggregateMetric with ID ${id} not found`);
    }

    return metric;
  }

  async update(id: number, userId: number, dto: UpdateAggregateMetricDto) {
    await this.findOne(id); // Ensure exists

    if (dto.entityType) {
      this.validateEntityLinkage(dto as any);
      await this.validateEntityExists(dto as any);
    }

    return this.prisma.aggregateMetrics.update({
      where: { id },
      data: {
        ...dto,
        updatedById: userId
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true, type: true } }
      }
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Ensure exists
    return this.prisma.aggregateMetrics.delete({ where: { id } });
  }

  // Helper: Get metrics grouped by metricType
  async findGrouped(query: {
    entityType?: string;
    organizationId?: number;
    regionId?: number;
    categoryId?: number;
  }) {
    const metrics = await this.findAll(query);

    const grouped = metrics.reduce((acc, metric) => {
      const type = metric.metricType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(metric);
      return acc;
    }, {} as Record<string, typeof metrics>);

    return grouped;
  }

  private validateEntityLinkage(dto: { entityType: string; organizationId?: number; regionId?: number; categoryId?: number }) {
    const linkageMap = {
      ORGANIZATION: 'organizationId',
      REGION: 'regionId',
      CATEGORY: 'categoryId'
    };

    const requiredField = linkageMap[dto.entityType];

    if (!dto[requiredField]) {
      throw new BadRequestException(`${requiredField} is required for entityType ${dto.entityType}`);
    }

    // Ensure other fields are null
    Object.entries(linkageMap).forEach(([type, field]) => {
      if (type !== dto.entityType && dto[field]) {
        throw new BadRequestException(`${field} must be null when entityType is ${dto.entityType}`);
      }
    });
  }

  private async validateEntityExists(dto: { entityType: string; organizationId?: number; regionId?: number; categoryId?: number }) {
    if (dto.organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: dto.organizationId }
      });
      if (!org) {
        throw new NotFoundException(`Organization with ID ${dto.organizationId} not found`);
      }
    }

    if (dto.regionId) {
      const region = await this.prisma.region.findUnique({
        where: { id: dto.regionId }
      });
      if (!region) {
        throw new NotFoundException(`Region with ID ${dto.regionId} not found`);
      }
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId }
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
      }
    }
  }
}
