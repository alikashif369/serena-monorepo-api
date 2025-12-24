import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategorySummaryDto } from './dto/create-category-summary.dto';
import { UpdateCategorySummaryDto } from './dto/update-category-summary.dto';

@Injectable()
export class CategorySummariesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateCategorySummaryDto) {
    // Validate at least one entity is specified
    if (!dto.organizationId && !dto.regionId && !dto.categoryId) {
      throw new BadRequestException('At least one of organizationId, regionId, or categoryId must be specified');
    }

    // Validate entity existence
    await this.validateEntityExists(dto);

    return this.prisma.categorySummary.create({
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
    organizationId?: number;
    regionId?: number;
    categoryId?: number;
  }) {
    const where: any = {};

    if (query?.organizationId) where.organizationId = query.organizationId;
    if (query?.regionId) where.regionId = query.regionId;
    if (query?.categoryId) where.categoryId = query.categoryId;

    return this.prisma.categorySummary.findMany({
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
    const summary = await this.prisma.categorySummary.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true, type: true } },
        updatedBy: { select: { id: true, name: true, email: true } }
      }
    });

    if (!summary) {
      throw new NotFoundException(`CategorySummary with ID ${id} not found`);
    }

    return summary;
  }

  async update(id: number, userId: number, dto: UpdateCategorySummaryDto) {
    await this.findOne(id); // Ensure exists

    if (dto.organizationId || dto.regionId || dto.categoryId) {
      await this.validateEntityExists(dto);
    }

    return this.prisma.categorySummary.update({
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
    return this.prisma.categorySummary.delete({ where: { id } });
  }

  private async validateEntityExists(dto: { organizationId?: number; regionId?: number; categoryId?: number }) {
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
